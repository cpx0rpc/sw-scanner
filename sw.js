Error.stackTraceLimit = 10000;//Infinity;

self.importScripts('db.js');

var __internal_idb__ = new Storage();
__internal_idb__.reset();
__internal_idb__ = new Storage();

var __internal_preloadCode__ = {};
var __internal_preloadInitCode__ = {};
var __internal_folderName__ = "example";
var __internal_fileList__ = [];
var __internal_root__ = "//localhost/swscanner/included_files/";
var __internal_mode__ = "";

self.importScripts('iroh-browser.js');
self.importScripts('helper.js');

self.Iroh = iroh;

function __internal_overrideTaintRelatedAPI__()
{
	var location_search = new String(location.search);
	location_search.taint = true;
	location_search.taint_list = [location.search];
	location_search.taint_src = 1;

	Object.defineProperty(this.location, "search", {
		 value: location_search
	}); 

	var location_href = new String(location.href);
	location_href.taint = true;
	location_href.taint_list = [location.href];
	location_href.taint_src = 1;

	Object.defineProperty(this.location, "href", {
		 value: location_href
	}); 

	var location_pathname = new String(location.pathname);
	location_pathname.taint = true;
	location_pathname.taint_list = [location.pathname];
	location_pathname.taint_src = 1;

	Object.defineProperty(this.location, "pathname", {
		 value: location_pathname
	}); 

	Object.defineProperty(this.location, "taint", {
		 value: true
	}); 

	Object.defineProperty(this.location, "taint_list", {
		 value: location_href
	}); 
	
	Object.defineProperty(this.location, "taint_src", {
		 value: 1
	}); 
}

function __internal_resetImportScripts__()
{
	self.importScripts = self.importScriptsOrig;
}

function __internal_overrideImportScriptsInit__()
{
	self.importScriptsOrig = self.importScripts;
	self.importScripts = function(args)
	{
		if(typeof(url) === typeof([]))
		{
			for(url of args)
			{
				url = decodeURIComponent(url.toString());
				let u = new URL(url.toString(), "https://"+__internal_folderName__.split("#")[1]);
				u = u.toString().replace("https://", "").replace("www.", "").replace(/\//g, "#_0");
				
				if(__internal_preloadInitCode__[u] != undefined)
				{
					(0, eval)(__internal_preloadInitCode__[u]);
				}
				else
				{
					__internal_pushResult__("[Error] Fail to parse importScripts URL " + u);
				}
			}
		}
		else
		{
			args = decodeURIComponent(args.toString());
			let u = new URL(args, "https://"+__internal_folderName__.split("#")[1]);
			u = u.toString().replace("https://", "").replace("www.", "").replace(/\//g, "#_0");

			if(__internal_preloadInitCode__[u] != undefined)
			{
				(0, eval)(__internal_preloadInitCode__[u]);
			}
			else
			{
				__internal_pushResult__("[Error] Fail to parse importScripts URL " + u);
			}
		}
	}
}

function __internal_overrideImportScripts__()
{
	self.importScriptsOrig = self.importScripts;
	self.importScripts = function(args)
	{
		if(__internal_checkTaintArgument__(args))
		{
			__internal_pushResult__("[FATAL] An importScripts argument contains tainted value. " + __internal_obj2str__(args));
		}

		if(typeof(url) === typeof([]))
		{
			for(url of args)
			{
				url = decodeURIComponent(url.toString());
				let u = new URL(url.toString(), "https://"+__internal_folderName__.split("#")[1]);
				u = u.toString().replace("https://", "").replace("www.", "").replace(/\//g, "#_0");
				
				if(__internal_preloadCode__[u] != undefined)
				{
					(0, eval)(__internal_preloadCode__[u]);
				}
				else
				{
					__internal_pushResult__("[Error] Fail to parse importScripts URL " + u);
				}
			}
		}
		else
		{
			args = decodeURIComponent(args.toString());
			let u = new URL(args, "https://"+__internal_folderName__.split("#")[1]);
			u = u.toString().replace("https://", "").replace("www.", "").replace(/\//g, "#_0");

			if(__internal_preloadCode__[u] != undefined)
			{
				(0, eval)(__internal_preloadCode__[u]);
			}
			else
			{
				__internal_pushResult__("[Error] Fail to parse importScripts URL " + u);
			}
		}
	}
}

self.addEventListener('install', function(event) {
  console.log("Initial SW Installed");
  
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
   console.log("SW Activated");
   
   event.waitUntil(self.clients.claim());
});

self.addEventListener('message', function(event){  
	if(event.data.command == "inforesp")
  {
		console.log("Analyzing!");
		__internal_folderName__ = event.data.filename;
		__internal_mode__ = event.data.mode;
		if(__internal_mode__ == "analyze")
		{
			__internal_takenPath__ = JSON.parse(event.data.takenPath);
		}

		/*fetch('//localhost/personal/iroh/idbinfo/' + __internal_folderName__.replace("#", "%23")).then(data => {
			data.text().then(fp => {
				lines = fp.split("\n");

				__internal_initIDB__(lines);
				console.log("Init IDB success");
			}).catch(err => {
				__internal_pushResult__("[ERROR] Cannot fetch IDB info from " + __internal_folderName__);
			});
		}).catch(err => {
			__internal_pushResult__("[ERROR] Cannot fetch IDB info from " + __internal_folderName__);
		});*/

		fetch('//localhost/swscanner/listfile.php?folder='+__internal_folderName__.replace("#", "%23")).then(data => {
			data.text().then(j => {
				j = JSON.parse(j);
				for(k in j)
				{
					__internal_fileList__.push(j[k]);
				}

				__internal_analyze__();
			}).catch(err => {
				__internal_pushResult__("[ERROR] Cannot fetch file list from " + __internal_folderName__);
			});
		}).catch(err => {
			__internal_pushResult__("[ERROR] Cannot fetch file list from " + __internal_folderName__);
		});
  }
  else
  {
    __internal_pushResult__("[ERROR] Unknown command: ", event.data.command);
  }
});

function __internal_initIDB__(lines)
{
	for(let i=0; i<lines.length; i++)
	{
		if(lines[i].length > 0)
		{
			let j = JSON.parse(lines[i]);

			if(j["action"] == "save")
			{
				__internal_idb__.set(j["key"], j["value"]);
			}
		}
	}
}

function __internal_savePathInfo__()
{
	self.clients.matchAll().then(clients => {
		clients.forEach(client => client.postMessage({'command': 'savepath', 'data': JSON.stringify(__internal_takenPath__)}));
	});
}

async function __internal_analysiscb__()
{
	if(__internal_mode__ == "init")
	{
		__internal_overrideImportScriptsInit__();
		(0, eval)(__internal_preloadInitCode__["sw.js"]);

		await sleep(5000);

		__internal_savePathInfo__();
	}
	else if(__internal_mode__ == "analyze")
	{	
		__internal_overrideImportScripts__();
		__internal_overrideTaintRelatedAPI__();

		(0, eval)(__internal_preloadCode__["sw.js"]);
	}
}
