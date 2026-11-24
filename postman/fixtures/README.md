Small test files for the Postman collection (form-data uploads).
In the Postman app, set Settings → General → Working directory to the
`postman/` folder of this repo, so paths like `fixtures/banner.png` resolve.
`virus.exe` is a plain text file used to check that the API refuses .exe uploads.

Not the same as linking a folder (Local View / "Open folder" in the workspace
menu): don't link this folder, or Postman writes its own files into it.
