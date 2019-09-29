move %APPDATA%\vlc\vlc-qt-interface.ini %APPDATA%\vlc\vlc-qt-interface.ini.default
move %APPDATA%\vlc\vlc-qt-interface.ini.sports %APPDATA%\vlc\vlc-qt-interface.ini
"%ProgramFiles%\VideoLAN\VLC\vlc.exe" --no-ignore-config --config %~dp0recorded_sports "%1"
move %APPDATA%\vlc\vlc-qt-interface.ini %APPDATA%\vlc\vlc-qt-interface.ini.sports
move %APPDATA%\vlc\vlc-qt-interface.ini.default %APPDATA%\vlc\vlc-qt-interface.ini