Set ws = CreateObject("WScript.Shell")
desktopPath = ws.SpecialFolders("Desktop")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sc = ws.CreateShortcut(desktopPath & "\Silly Tavern Tao Dich Card.lnk")
sc.TargetPath = scriptDir & "\khoi-dong.bat"
sc.WorkingDirectory = scriptDir
sc.Description = "Silly Tavern Tao Dich Card"
sc.Save
WScript.Echo "Desktop shortcut created!"
