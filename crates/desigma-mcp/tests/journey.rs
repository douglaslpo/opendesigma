#![cfg(feature = "server")]
//! Session-boundary checks that the stdio, importer and render suites do not
//! cover together: create → edit → undo → save → reopen, a rejected call that
//! leaves the next call usable, legacy list text, and a pixel compare against
//! the bundled Inter face.
//!
//! Complements, and does not replace:
//! - `tests/stdio.rs` — subprocess MCP, tool count, SVG markup import
//! - `tests/session.rs` — workspace confinement and the unsaved-edit guard
//! - `desigma-doc` `migrate_literal_lists` — the migration itself
//! - `desigma-fig` / `desigma-svg` / `desigma-pen` importer tests
//! - `desigma-render` `tests/fonts.rs` — face selection
//!
//! Latency is printed as `DESIGMA_JOURNEY_LATENCY_MS`. There is no pass/fail
//! budget: the evidence note records the baseline.

use desigma_diff::{compare, DiffOptions};
use desigma_doc::{ListKind, NodeId, NodeKind};
use desigma_mcp::server::Session;
use serde_json::json;
use std::{
    fs,
    path::PathBuf,
    sync::atomic::{AtomicU64, Ordering},
    time::Instant,
};

/// Per-channel delta still treated as equal. Registered with the bundled Inter
/// face (see `crates/desigma-fonts/assets/README.md`). Identical re-renders and
/// the unknown-family fallback must land inside this tolerance. It is not a
/// performance target.
const REGISTERED_TOLERANCE: u8 = 0;
const REGISTERED_FONT: &str = "Inter";
const FONT_NOTE: &str = include_str!("../../desigma-fonts/assets/README.md");

fn unique_suffix() -> u128 {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    nanos * 1_000_000 + u128::from(COUNTER.fetch_add(1, Ordering::Relaxed))
}

struct Workspace(PathBuf);
impl Workspace {
    fn new() -> Self {
        let p = std::env::temp_dir().join(format!("desigma-journey-{}-{}", std::process::id(), unique_suffix()));
        fs::create_dir(&p).unwrap();
        Self(p)
    }
}
impl Drop for Workspace {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn session(dir: &Workspace) -> Session {
    Session::with_discovery(&dir.0, None).unwrap()
}

fn page_id(s: &mut Session) -> u64 {
    s.call("desigma_get_document", json!({})).unwrap()["pages"][0]["node_id"].as_u64().unwrap()
}

fn text_of(s: &mut Session, id: u64) -> String {
    s.call("desigma_get_node", json!({"node_id": id})).unwrap()["node"]["kind"]["Text"]["content"].as_str().unwrap().to_string()
}

fn png(bytes: &[u8]) -> image::RgbaImage {
    image::load_from_memory(bytes).unwrap().to_rgba8()
}

fn width_of(s: &mut Session, id: u64) -> f64 {
    s.call("desigma_get_node", json!({"node_id": id})).unwrap()["node"]["size"]["x"].as_f64().unwrap()
}

#[test]
fn create_edit_undo_persist_and_reopen_follows_call_order() {
    let started = Instant::now();
    let dir = Workspace::new();
    let mut s = session(&dir);
    let page = page_id(&mut s);

    let created = s.call("desigma_create_node", json!({"parent_id": page, "kind": "text", "name": "Title", "text": "Antes"})).unwrap();
    let id = created["node"]["id"].as_u64().unwrap();
    let mut seen = vec![text_of(&mut s, id)];

    s.call("desigma_update_node", json!({"node_id": id, "text": "Depois"})).unwrap();
    seen.push(text_of(&mut s, id));

    let undone = s.call("desigma_undo", json!({})).unwrap();
    assert_eq!(undone["changed"], true);
    seen.push(text_of(&mut s, id));
    assert_eq!(seen, ["Antes".to_string(), "Depois".to_string(), "Antes".to_string()], "effects follow the call order");
    assert_eq!(s.call("desigma_get_document", json!({})).unwrap()["can_undo"], true);

    s.call("desigma_save_file", json!({"path": "journey.desigma"})).unwrap();
    let elapsed = started.elapsed();
    eprintln!("DESIGMA_JOURNEY_LATENCY_MS={:.3}", elapsed.as_secs_f64() * 1000.0);
    assert!(elapsed.as_nanos() > 0, "latency was measured; no budget is asserted");

    let mut again = session(&dir);
    again.call("desigma_open_file", json!({"path": "journey.desigma"})).unwrap();
    let doc = again.call("desigma_get_document", json!({})).unwrap();
    assert_eq!(doc["can_undo"], false, "a reopened file starts a fresh history");
    assert_eq!(text_of(&mut again, id), "Antes");
    assert_eq!(doc["path"], "journey.desigma");
}

#[test]
fn two_creates_undo_in_lifo_order() {
    let dir = Workspace::new();
    let mut s = session(&dir);
    let page = page_id(&mut s);
    let a = s.call("desigma_create_node", json!({"parent_id": page, "kind": "rectangle", "name": "A"})).unwrap()["node"]["id"].as_u64().unwrap();
    let b = s.call("desigma_create_node", json!({"parent_id": page, "kind": "rectangle", "name": "B"})).unwrap()["node"]["id"].as_u64().unwrap();
    s.call("desigma_undo", json!({})).unwrap();
    assert!(s.call("desigma_get_node", json!({"node_id": b})).is_err(), "the later create undoes first");
    assert!(s.call("desigma_get_node", json!({"node_id": a})).is_ok(), "the earlier create is still there");
    s.call("desigma_undo", json!({})).unwrap();
    assert!(s.call("desigma_get_node", json!({"node_id": a})).is_err());
}

#[test]
fn a_rejected_edit_does_not_consume_history_or_block_the_next_call() {
    let dir = Workspace::new();
    let mut s = session(&dir);
    let page = page_id(&mut s);
    let id =
        s.call("desigma_create_node", json!({"parent_id": page, "kind": "rectangle", "name": "Box", "width": 10})).unwrap()["node"]["id"].as_u64().unwrap();
    let before = s.call("desigma_get_node", json!({"node_id": id})).unwrap();
    let err = s.call("desigma_update_node", json!({"node_id": id, "width": -1})).unwrap_err();
    assert!(err.contains("width") || err.contains("minimum") || err.contains("0"), "{err}");
    assert_eq!(s.call("desigma_get_node", json!({"node_id": id})).unwrap(), before);
    s.call("desigma_update_node", json!({"node_id": id, "width": 20})).unwrap();
    assert_eq!(width_of(&mut s, id), 20.0);
    s.call("desigma_undo", json!({})).unwrap();
    assert_eq!(width_of(&mut s, id), 10.0, "undo skips the rejected call");
}

#[test]
fn legacy_literal_lists_migrate_when_the_file_is_opened() {
    let dir = Workspace::new();
    let mut s = session(&dir);
    let page = page_id(&mut s);
    let bullet = "\u{2022} one\n\u{2022} two";
    let id =
        s.call("desigma_create_node", json!({"parent_id": page, "kind": "text", "name": "Legacy", "text": bullet})).unwrap()["node"]["id"].as_u64().unwrap();
    s.call("desigma_save_file", json!({"path": "legacy.desigma"})).unwrap();

    let path = dir.0.join("legacy.desigma");
    let old = fs::read_to_string(&path)
        .unwrap()
        .replace("\"paragraph\"", "\"paragraph_x\"")
        .replace("\"lists\"", "\"lists_x\"")
        .replace("\"direction\"", "\"direction_x\"")
        .replace("\"features\"", "\"features_x\"");
    fs::write(&path, old).unwrap();

    s.call("desigma_open_file", json!({"path": "legacy.desigma"})).unwrap();
    let NodeKind::Text(text) = &s.engine.doc.get(NodeId(id)).unwrap().kind else { panic!("text node missing") };
    assert_eq!(text.content, "one\ntwo");
    assert!(text.paragraph_lists().iter().all(|item| item.is_some_and(|item| item.kind == ListKind::Bullet)));
}

#[test]
fn exported_text_matches_the_registered_inter_face_within_tolerance() {
    assert!(FONT_NOTE.contains(REGISTERED_FONT), "font note names {REGISTERED_FONT}");
    assert!(FONT_NOTE.contains("OFL"), "font note records the license");
    assert!(FONT_NOTE.contains("4.001"), "font note records the face version");

    let dir = Workspace::new();
    let mut s = session(&dir);
    let page = page_id(&mut s);
    let id = s
        .call("desigma_create_node", json!({"parent_id": page, "kind": "text", "name": "Sample", "text": "Hamburgefonstiv", "width": 420, "height": 64}))
        .unwrap()["node"]["id"]
        .as_u64()
        .unwrap();
    s.call("desigma_set_text_style", json!({"node_id": id, "font_family": REGISTERED_FONT, "font_size": 32.0, "font_weight": 400})).unwrap();
    s.call("desigma_export_image", json!({"node_id": id, "path": "inter.png"})).unwrap();
    let inter = fs::read(dir.0.join("inter.png")).unwrap();

    s.call("desigma_set_text_style", json!({"node_id": id, "font_family": "Definitely Not A Font"})).unwrap();
    s.call("desigma_export_image", json!({"node_id": id, "path": "alias.png"})).unwrap();
    let alias = fs::read(dir.0.join("alias.png")).unwrap();

    let opts = DiffOptions { tolerance: REGISTERED_TOLERANCE, detect_aa: true, ignore: Vec::new() };
    let report = compare(&png(&inter), &png(&alias), &opts);
    assert_eq!(report.mismatched, 0, "unknown family falls back to {REGISTERED_FONT} within tolerance {REGISTERED_TOLERANCE}: {report:?}");
    assert!((report.ssim - 1.0).abs() < 1e-9, "ssim {}", report.ssim);

    s.call("desigma_undo", json!({})).unwrap();
    s.call("desigma_export_image", json!({"node_id": id, "path": "again.png"})).unwrap();
    let again = fs::read(dir.0.join("again.png")).unwrap();
    let round = compare(&png(&inter), &png(&again), &opts);
    assert_eq!(round.mismatched, 0, "undo restores the registered face: {round:?}");
}

#[test]
fn svg_file_opens_through_the_session_importer() {
    let dir = Workspace::new();
    fs::write(dir.0.join("mark.svg"), r##"<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#112233"/></svg>"##)
        .unwrap();
    let mut s = session(&dir);
    let doc = s.call("desigma_open_file", json!({"path": "mark.svg"})).unwrap();
    assert!(doc["node_count"].as_u64().unwrap() >= 2, "the svg importer added a layer: {doc}");
    assert_eq!(doc["session"], "file");
}
