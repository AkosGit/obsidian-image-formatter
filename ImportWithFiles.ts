import {MarkdownView, App, Notice} from "obsidian";
import {MdImportExportSettings} from "./main";
import * as url from "url";
// @ts-ignore
import fs from "fs";

export class ImportWithFiles{
	App:App;
	View:MarkdownView
	Settings:MdImportExportSettings;
	Md:string;
	nUrls:number;
	constructor(app:App,settings:MdImportExportSettings,view:MarkdownView) {
		this.App=app;
		this.View=view;
		this.Settings=settings;
		this.Md=view.data;
		if(settings.file_folder==""){
			new Notice("Import failed, please provide a path for the imported files")
		}
		else {
			const urls:Array<string>=this.getDocUrls();
			this.nUrls=urls.length;
			this.processUrls(urls)
		}
	}
	getDocUrls():Array<string>{
		const Regex= new RegExp("!\\[.*\\]\\((\\S*)+?\\)|!\\[.*\\]\\((\\S*)+? ","g")
		const files:Array<string>=new Array<string>()
		let matches: string[];
		// eslint-disable-next-line no-cond-assign
		while (matches = Regex.exec(this.Md)) {//getting all atachments in doc
			files.push(matches[1])
		}
		return files
	}
	processUrls(urls:Array<string>){
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const scope=this;
		let client:any;
		urls.forEach(
			f=> {
				if(f.startsWith("http://") || f.startsWith("https://"))//if its a link
				{
					if(f.startsWith("https")){
						client=require('https');
					}
					else {client=require('http');}
					client.get(url.parse(f), (res: any) => {
						const data: Array<Uint8Array>=new Array<Uint8Array>();
						res.on('data', (chunk: Uint8Array) => {
							data.push(chunk);
						}).on('end',()=> scope.createFile(data,f));
					});
				}

			}
		)
	}
	async createFile(data:Array<Uint8Array>,url:string){
		const buffer:ArrayBuffer=Buffer.concat(data)
		let path=this.Settings.file_folder;
		if(!path.startsWith("/")){
			path="/"+path;
		}
		if(!path.endsWith("/")){path=path+"/"}
		if(url.endsWith("/")){url=url.slice(0,-1)}
		const filename=new RegExp(".*/(.*)$","g").exec(url)[1]
		await this.App.vault.createBinary(path+filename,buffer)
		this.replaceFile(url,filename)
	}
	replaceFile(oldN:string,newN:string){
		console.log(oldN)
		console.log(newN)
		const reg= new RegExp("!\\[.*\\]\\(\\s*"+oldN+"\\s*\\)", "g")
		this.Md=this.Md.replace(reg,"![["+newN+"]]");
		this.nUrls--;
		if(this.nUrls==0){//if all files were processed
			this.WriteToFile();
		}
	}
	WriteToFile(){
		console.log(this.Md);
		// @ts-ignore
		const bpath=this.App.vault.adapter.basePath;
		const path=bpath+"/"+this.View.file.parent.path+"/"+this.View.file.basename+"_imported.md"
		fs.writeFile(path, this.Md, (err: never) => {
			if(err){
				new Notice("Import has failed,can't write to file!")
			}
			else{
				new Notice("Import was successful!")
			}
		});
	}

}
