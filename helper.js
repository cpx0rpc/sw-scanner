self.importScripts('init_analyze.js');
self.importScripts('analyze.js');

var __internal_appendingResult__ = {"queue": []};
var __internal__MAX_FILE_SIZE__ = 102400;

function __internal_encodeString__(data)
{
	let d = data;
	d = d.replace(/{/g, "@_0");
	d = d.replace(/}/g, "@_1");
	d = d.replace(/\"/g, "@_2");
	d = d.replace(/\[/g, "@_3");
	d = d.replace(/\]/g, "@_4");
	return d;
}

function __internal_report__(data)
{	
	//console.log("Reporting: ", filename, data);
	fetch("logResult.php", {
		method: "POST",
		body: "{\"filename\": \"" + __internal_folderName__ + "\", \"data\": \"" + __internal_encodeString__(data) + "\\n\"}"
	}).then(function(response) {
		if(!response.ok)
		{
			console.warn("Cannot save result, add to queue!!");
			__internal_appendingResult__["queue"].unshift(data);
			return false;
		}
		else
		{
			return true;
		}
	});
}

function __internal_syncResult__()
{
	while(__internal_oldResultExisted__())
	{
		let data = __internal_popResult__();
		__internal_report__(data);
	}
}

function __internal_oldResultExisted__()
{
	if(__internal_appendingResult__["queue"].length > 0)
	{
		return true;
	}
	else
	{
		return false;
	}
}

function __internal_pushResult__(data)
{
	__internal_appendingResult__["queue"].push(data);
	__internal_syncResult__();
	console.log(data);
}

function __internal_popResult__()
{
	return __internal_appendingResult__["queue"].shift();
}

//Load and transform all files in the target folder and save to a global variable
async function __internal_loadFiles__()
{
	let ret = true;

	for(let i=0; i<__internal_fileList__.length; i++) 
	{
		let file = __internal_fileList__[i];
		let path = __internal_root__ + __internal_folderName__ + "/" + file;

		await fetch(path.replace(/#/g, "%23").replace(/\?/g, "%3f")).then(resp => {
			if(!resp.ok)
			{
				__internal_pushResult__("[ERROR] Cannot fetch from " + path);
				ret = false;
			}
			else
			{
				resp.text().then(code => {
					if(code.length < __internal__MAX_FILE_SIZE__)
					{
						if(__internal_mode__ == "init")
						{
							var init_stage = new Iroh.Stage(code);
				
							__internal_registerPathHandler__(init_stage, i);
							__internal_preloadInitCode__[file] = init_stage.script;
						}
						else if(__internal_mode__ == "analyze")
						{
							var stage = new Iroh.Stage(code);
							__internal_registerHandler__(stage, i);
							__internal_preloadCode__[file] = stage.script;
						}
					}
					else
					{
						//File is too large
						if(__internal_mode__ == "init")
						{
							__internal_preloadInitCode__[file] = code;
						}
						else if(__internal_mode__ == "analyze")
						{					
							__internal_preloadCode__[file] = code;
						}

						__internal_pushResult__("[ERROR] File too large " + code.length + " " + path);
					}
				}).catch(err => {
					__internal_pushResult__("[ERROR] Cannot transform " + path);
					ret = false;
				});
			}
		}).catch(err => {
			__internal_pushResult__("[ERROR] Cannot fetch from " + path);
			ret = false;
		});
	}

	return ret;
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function __internal_analyze__()
{
	let status = await __internal_loadFiles__();
	await sleep(5000);

	if(status)
	{
		__internal_pushResult__("[SUCCESS] " + __internal_folderName__);
		try
		{
			__internal_analysiscb__();
		}
		catch(err)
		{
			__internal_pushResult__("[Error] " + err.toString());
		}
	}
	else
	{
		__internal_pushResult__("[FAIL] " + __internal_folderName__);
	}
}
