use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PomodoroSettings {
    pub work_duration: u32,
    pub short_break: u32,
    pub long_break: u32,
    pub sessions_before_long_break: u32,
    pub auto_start_breaks: bool,
    pub auto_start_work: bool,
    pub sound_enabled: bool,
    pub notification_enabled: bool,
}

impl Default for PomodoroSettings {
    fn default() -> Self {
        Self {
            work_duration: 25,
            short_break: 5,
            long_break: 15,
            sessions_before_long_break: 4,
            auto_start_breaks: false,
            auto_start_work: false,
            sound_enabled: true,
            notification_enabled: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: u32,
    pub session_type: String,
    pub duration: u32,
    pub completed_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PomodoroData {
    pub settings: PomodoroSettings,
    pub total_sessions: u32,
    pub total_work_time: u32,
    pub sessions_today: u32,
    pub last_session_date: String,
    pub history: Vec<Session>,
}

impl Default for PomodoroData {
    fn default() -> Self {
        Self {
            settings: PomodoroSettings::default(),
            total_sessions: 0,
            total_work_time: 0,
            sessions_today: 0,
            last_session_date: String::new(),
            history: Vec::new(),
        }
    }
}

fn get_data_path() -> PathBuf {
    let data_dir = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("PomodoroTimer");
    fs::create_dir_all(&data_dir).ok();
    data_dir.join("data.json")
}

#[tauri::command]
fn load_data() -> Result<PomodoroData, String> {
    let path = get_data_path();
    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())
    } else {
        Ok(PomodoroData::default())
    }
}

#[tauri::command]
fn save_data(data: PomodoroData) -> Result<(), String> {
    let path = get_data_path();
    let content = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_settings(settings: PomodoroSettings) -> Result<(), String> {
    let mut data = load_data().unwrap_or_default();
    data.settings = settings;
    save_data(data)
}

#[tauri::command]
fn record_session(session_type: String, duration: u32) -> Result<PomodoroData, String> {
    let mut data = load_data().unwrap_or_default();
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    if data.last_session_date != today {
        data.sessions_today = 0;
        data.last_session_date = today.clone();
    }

    let session = Session {
        id: data.history.len() as u32 + 1,
        session_type: session_type.clone(),
        duration,
        completed_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    };

    data.history.push(session);

    if session_type == "work" {
        data.total_sessions += 1;
        data.total_work_time += duration;
        data.sessions_today += 1;
    }

    save_data(data.clone())?;
    Ok(data)
}

#[tauri::command]
fn get_statistics() -> Result<PomodoroData, String> {
    load_data()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            load_data,
            save_data,
            save_settings,
            record_session,
            get_statistics
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            #[cfg(debug_assertions)]
            window.open_devtools();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
