use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, State, WindowEvent,
};

const KEYCHAIN_SERVICE: &str = "com.codiac.sabilearn.desktop";

struct AppState {
    keep_awake: Mutex<Option<keepawake::KeepAwake>>,
    close_to_tray: AtomicBool,
    oauth_listener: Mutex<Option<TcpListener>>,
}

#[derive(Serialize)]
struct OAuthCallback {
    code: String,
    state: String,
}

#[tauri::command]
fn keychain_get(key: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(val) => Ok(Some(val)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn keychain_set(key: String, value: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
fn keychain_delete(key: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn set_keep_awake(enabled: bool, state: State<'_, AppState>) -> Result<(), String> {
    let mut guard = state.keep_awake.lock().map_err(|e| e.to_string())?;
    if enabled {
        if guard.is_none() {
            let handle = keepawake::Builder::default()
                .display(true)
                .idle(true)
                .sleep(true)
                .reason("SabiLearn AI Course Generation")
                .app_name("SabiLearn")
                .create()
                .map_err(|e| e.to_string())?;
            *guard = Some(handle);
        }
    } else {
        *guard = None;
    }
    Ok(())
}

#[tauri::command]
fn set_close_to_tray(enabled: bool, state: State<'_, AppState>) {
    state.close_to_tray.store(enabled, Ordering::Relaxed);
}

#[tauri::command]
fn oauth_start_loopback(state: State<'_, AppState>) -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let mut guard = state.oauth_listener.lock().map_err(|e| e.to_string())?;
    *guard = Some(listener);
    Ok(port)
}

#[tauri::command]
async fn oauth_wait_callback(state: State<'_, AppState>) -> Result<OAuthCallback, String> {
    let listener = {
        let mut guard = state.oauth_listener.lock().map_err(|e| e.to_string())?;
        guard
            .take()
            .ok_or_else(|| "OAuth loopback server not started".to_string())?
    };

    tauri::async_runtime::spawn_blocking(move || {
        listener
            .set_nonblocking(false)
            .map_err(|e| e.to_string())?;
        let (mut stream, _) = listener.accept().map_err(|e| e.to_string())?;
        let mut buf = [0u8; 4096];
        let n = stream.read(&mut buf).map_err(|e| e.to_string())?;
        let req = String::from_utf8_lossy(&buf[..n]);

        let first_line = req.lines().next().unwrap_or_default();
        let path = first_line.split_whitespace().nth(1).unwrap_or_default();
        let query = path.split('?').nth(1).unwrap_or_default();

        let mut code = String::new();
        let mut oauth_state = String::new();
        for pair in query.split('&') {
            if let Some((k, v)) = pair.split_once('=') {
                if k == "code" {
                    code = url_decode(v);
                } else if k == "state" {
                    oauth_state = url_decode(v);
                }
            }
        }

        let body = if code.is_empty() {
            "<html><body style='font-family:system-ui;padding:40px;text-align:center'><h2>Sign-in cancelled</h2><p>You can close this tab and return to SabiLearn.</p></body></html>"
        } else {
            "<html><body style='font-family:system-ui;padding:40px;text-align:center'><h2>Signed in to SabiLearn</h2><p>You can close this tab and return to the desktop app.</p></body></html>"
        };

        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            body.len(),
            body
        );
        let _ = stream.write_all(response.as_bytes());
        let _ = stream.flush();

        if code.is_empty() {
            return Err("No authorization code received".to_string());
        }

        Ok(OAuthCallback {
            code,
            state: oauth_state,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

fn url_decode(input: &str) -> String {
    let mut out = Vec::with_capacity(input.len());
    let bytes = input.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(hex) = std::str::from_utf8(&bytes[i + 1..i + 3]) {
                if let Ok(val) = u8::from_str_radix(hex, 16) {
                    out.push(val);
                    i += 3;
                    continue;
                }
            }
        } else if bytes[i] == b'+' {
            out.push(b' ');
            i += 1;
            continue;
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).to_string()
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .manage(AppState {
            keep_awake: Mutex::new(None),
            close_to_tray: AtomicBool::new(false),
            oauth_listener: Mutex::new(None),
        })
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build());

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            show_main_window(app);
            for arg in args {
                if arg.starts_with("sabilearn://") {
                    let _ = app.emit("deep-link-received", arg);
                }
            }
        }));
    }

    builder
        .setup(|app| {
            let open_item = MenuItem::with_id(app, "open", "Open SabiLearn", true, None::<&str>)?;
            let study_item = MenuItem::with_id(app, "study", "Study now", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_item, &study_item, &quit_item])?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("SabiLearn Desktop")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main_window(app),
                    "study" => {
                        show_main_window(app);
                        let _ = app.emit("tray-study-now", ());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _ = tray_builder.build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let state = window.state::<AppState>();
                if state.close_to_tray.load(Ordering::Relaxed) {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            keychain_get,
            keychain_set,
            keychain_delete,
            set_keep_awake,
            set_close_to_tray,
            oauth_start_loopback,
            oauth_wait_callback,
        ])
        .run(tauri::generate_context!())
        .expect("error while running SabiLearn Desktop");
}
