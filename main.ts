import {
	App,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting
} from 'obsidian';
import {ExportWithImages} from "./ExportWithImages";
import {ImportWithFiles} from "./ImportWithFiles";

export interface MdImportExportSettings {
	img_embed: boolean,
	clientId:string | null,
	file_folder: string
}

const DEFAULT_SETTINGS: MdImportExportSettings = {
	img_embed: false,
	clientId: "",
	file_folder:""
}

export default class MdImportExportPlugin extends Plugin {
	settings: MdImportExportSettings;

	async onload() {
		await this.loadSettings();
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'Export',
			name: 'Export markdown with images',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						new ExportWithImages(this.app,this.settings,markdownView)
					}
					// This command will only show up in Command Palette when the check function returns true
				}
				return true;
			}
		});
		this.addCommand({
			id: 'Import',
			name: 'Import with downloaded files',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						new ImportWithFiles(this.app,this.settings,markdownView)
					}
					// This command will only show up in Command Palette when the check function returns true
				}
				return true;
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MdImportExportPlugin;
	constructor(app: App, plugin: MdImportExportPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for Markdown exporter/importer plugin'});
		new Setting(containerEl)
			.setName('Use embedded images')
			.setDesc('WARNING: this will result in very slow render times! If turned on, in the exported images will be embedded in base64.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.img_embed)
				.onChange(async (value: boolean) => {
					this.plugin.settings.img_embed = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Client id for Imgur")
			.setDesc("You need to create an account and register an app here: https://api.imgur.com/oauth2/addclient")
			.addText(text => text
				.setPlaceholder('xxxxxxxxxxxxxxx')
				.setValue(this.plugin.settings.clientId)
				.onChange(async (value: string) => {
					this.plugin.settings.clientId = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("imported image folder path")
			.setDesc("This is where imported images will be saved")
			.addText(text => text
				.setPlaceholder("first_folder_in_vault/second_folder")
				.setValue(this.plugin.settings.file_folder)
				.onChange(async (value: string) => {
					this.plugin.settings.file_folder = value;
					await this.plugin.saveSettings();
				}));
	}
}
