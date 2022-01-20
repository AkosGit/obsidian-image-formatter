import {App, MarkdownRenderer, MarkdownView, Notice, TFile, View} from "obsidian";
import * as path from "path";
import MdExportPlugin, {MdExportSettings} from "./main";
import * as buffer from "buffer";
import * as fs from "fs";


export class ExportWithImages {
	App:App;
	View:MarkdownView
	ImageExtensions: Set<string> = new Set(['jpeg', 'jpg', 'png','svg', 'bmp']);
	Regex= new RegExp("!\\[\\[(.*)\\]\\]|!\\[.*\\]\\((.*)\\)","g");
	Settings:MdExportSettings;
	Md:string;
	index:number;
	constructor(app:App,settings:MdExportSettings,view:MarkdownView) {
		this.View=view;
		this.Settings=settings;
		this.App=app;
		this.Md=view.data;
		this.index=0;
		if(!settings.img_embed && settings.clientId==null){
			new Notice("Please provide a client id for ImgUrl")
		}
		else {
			const files :Array<TFile> = this.getImageFiles(this.GetDocImages());
			this.processImages(files);
		}
	}
	GetDocImages ():Array<string>
	{
		let matches: string[];
		let docimgs:Array<string>= [];
		while (matches = this.Regex.exec(this.Md)) {//getting all atachments in doc
			this.ImageExtensions.forEach((ext: string) =>{
				if(matches[1].endsWith(ext)){//if its an image
					docimgs.push(matches[1])
				}
			})
		}
		return docimgs
	}
	// Getting all available images saved in vault
	//from https://github.com/ozntel/oz-clear-unused-images-obsidian/blob/master/src/util.ts
	getImageFiles(docImgs: Array<string>):Array<TFile>
	{
		const allFiles: TFile[] = this.App.vault.getFiles();
		let images: Array<TFile> = new Array<TFile>();
		for (let i = 0; i < allFiles.length; i++) {
			if (this.ImageExtensions.has(allFiles[i].extension.toLowerCase())) {
				const filename:string =allFiles[i].basename+"."+allFiles[i].extension
				if(docImgs.contains(filename)){//if its in the doc
					images.push(allFiles[i])
				}
			}
		}
		return images
	}
	processImages(files:Array<TFile>){
		files.forEach(
			async (file:TFile) =>{
				let buf:ArrayBuffer= await this.App.vault.readBinary(file)
				if(this.Settings.img_embed){
					this.Embed(buf,file.name,files.length)
				}
				else {
					this.Imgurl(buf,file.name,files.length)
				}
			}
		)
		this.WriteToFile();
	}
	replaceImage(oldN:string,newN:string,nfiles:number){
		console.log(oldN)
		const reg= new RegExp("!\\[\\[\\s*"+oldN+"\\s*\\]\\]|!\\[.*\\]\\(\\s*"+oldN+"\\s*\\)", "g")
		this.Md=this.Md.replace(reg,newN);
		this.index++;
		if(this.index==nfiles){//if all images were processed
			this.WriteToFile();
		}
	}
	Embed(file:ArrayBuffer,name:string,nfiles:number)
	{
		const img64:string = "!["+name+"](data:image/png;base64,"+this.arrayBufferToBase64(file)+")"
		this.replaceImage(name,img64,nfiles)
	}
	//from https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
	arrayBufferToBase64( buffer : ArrayBuffer) {
		let binary = '';
		let bytes = new Uint8Array( buffer );
		let len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode( bytes[ i ] );
		}
		return window.btoa( binary );
	}
	//adopted from https://codepen.io/hoanghals/pen/qyeXEx
	Imgurl(file:ArrayBuffer,name:string,nfiles:number)
	{
		const finished = (evt:Event)=>{
			const jresp = JSON.parse((<XMLHttpRequest>evt.target).responseText);
			console.log(jresp.data.link)
			this.replaceImage(name,"![]("+jresp.data.link+")",nfiles)
		}
		const UPLOAD_URL= "https://api.imgur.com/3/image.json";
		const fd = new FormData();
		fd.append("image", new Blob([file]), name);
		// AJAX Request
		const xhr = new XMLHttpRequest();
		xhr.addEventListener("load", finished);
		xhr.open("POST", UPLOAD_URL);
		// Send authentication headers.
		xhr.setRequestHeader("Authorization", "Client-ID " + this.Settings.clientId);
		// Send form data
		xhr.send(fd);
	}
	WriteToFile(){
		console.log(this.Md);
		// @ts-ignore
		let bpath=this.App.vault.adapter.basePath;
		const path=bpath+"/"+this.View.file.parent.path+"/"+this.View.file.basename+"_exported.md"
		fs.writeFile(path, this.Md, function (err) {
			if(err){
				new Notice("Export has failed!")
			}
			else{
				new Notice("Export was successful!")
			}
		});
	}
}

