import {
	App,
	Editor,
	FileSystemAdapter,
	MarkdownRenderer,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting
} from 'obsidian';
import * as path from "path";
import GetImages, {Embed, ExportWithImages, Imgurl, WriteToFile} from "./ExportWithImages";



export interface MdExportSettings {
	img_embed: boolean,
	clientId:string | null
}

const DEFAULT_SETTINGS: MdExportSettings = {
	img_embed: false,
	clientId: null
}

export default class MdExportPlugin extends Plugin {
	settings: MdExportSettings;

	async onload() {
		await this.loadSettings();

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'Export',
			name: 'Export document to MD',
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
	plugin: MdExportPlugin;

	constructor(app: App, plugin: MdExportPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for md export plugin'});
		new Setting(containerEl)
			.setName('WARNING: this will result in very slow render times\nUse embedded images')
			.setDesc('If turned on, in the exported file the images will be embedded in base64 else they will be uploaded to ImgUrl')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.img_embed)
				.onChange(async (value: boolean) => {
					this.plugin.settings.img_embed = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Client id for ImgUrl")
			.setDesc("You need to create an account and register an app here: https://api.imgur.com/oauth2/addclient")
			.addText(text => text
				.setPlaceholder('xxxxxxxxxxxxxxx')
				.setValue(this.plugin.settings.clientId)
				.onChange(async (value: string) => {
					this.plugin.settings.clientId = value;
					await this.plugin.saveSettings();
				}));
	}
}
