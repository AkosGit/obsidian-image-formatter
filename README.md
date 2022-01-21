# Obsidian markdown importer/exporter plugin
- This plugin is for the markdown editor Obsidian: (https://obsidian.md).
- Features
  - Export
    - export markdown with embedded images (with base64 format), or with uploaded images.
    - currently Imgur is the only option for uploading images, which requires a client id.
    - client id can be acquired by creating an account and registering an app: https://api.imgur.com/oauth2/addclient .
    - this only works if your image is located in your vault
  - Import
    - markdown file can be imported with all online files downloaded to a specified directory. 
## Project status
- 🚧 in development,unstable 🚧
- major features implemented
## Install
- The plugin can be installed by cloning the repository and placing the folder to VaultFolder/.obsidian/plugins/
## Usage
- Press Ctrl+P/Cmd+P to show the command palette 
- Search for Markdown
## Todo
- [ ] more testing
- [ ] better error handling
- [ ] add more upload options
- [ ] support for image alt text
- [ ] support for images located outside vault
