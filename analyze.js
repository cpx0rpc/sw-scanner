var __internal_executed__ = [];
var __internal_fnArgument__ = {};
var __internal_2bTaint__ = {};

function __internal_obj2str__(obj)
{
	if(!obj)
	{
		return "";
	}

	let result = "";

	if(typeof(obj.valueOf()) != "string")
	{
		result = "{";

		for(let k in obj)
		{
			if(obj.hasOwnProperty(k))
			{
				result = result + '"' + k + '": ' + __internal_obj2str__(obj[k]) + ', ';
			}
		}

		result = result.substring(0, result.length - 2) + "}";
	}
	else
	{
		result = result + '{"value": "' + obj.valueOf() + '", "taint": ' + obj.taint + ', "taint_src": ' + obj.taint_src + ', "taint_list": ' + JSON.stringify(obj.taint_list) + '}';
	}

	return result;
}

function __internal_extractList__(result, obj)
{
	if(!result || !obj)
	{
		return [];
	}

	let ret = [];

	if(typeof(obj.valueOf()) == "string")
	{
		let found = false;

		if(obj.taint_list)
		{
			for(let i=0; i<obj.taint_list.length; i++)
			{
				let t = obj.taint_list[i];

				//Case 1: result is a subset
				if(result.includes(t))
				{
					if(!ret.includes(t))
					{
						ret.push(t.valueOf());
						found = true;
					}
				}
				//Case 2: obj is a subset
				else if(t.includes(result.valueOf()))
				{
					if(!ret.includes(result.valueOf()))
					{
						ret.push(result.valueOf());
						found = true;
					}
				}
				//Case 3: result = obj
				else if(result.valueOf == t)
				{
					if(!ret.includes(result.valueOf()))
					{
						ret.push(result.valueOf());
						found = true;
					}
				}
			}		
		}
		if(!found)
		{
			if(!ret.includes(result.valueOf()))
			{
				ret.push(result.valueOf());
			}
		}
	}
	else if(typeof(obj) == "object")
	{
		//Recursively find the taint part
		for(var k in Object.keys(obj))
		{
			ret = ret.concat(__internal_extractList__(result, obj[k]));
		}
	}

	return ret;
}

function __internal_taintResult__(result, args, obj, taint_src=32)
{
	let ret = result;

	if(!result)
	{
		return ret;
	}

	if(typeof(result) == "string" || result instanceof String)
	{
		if(result.taint != true)
		{
			ret = new String(result);
			ret.taint = true;
			ret.taint_list = [];
			ret.taint_src = taint_src;
		}
		else
		{
			if(ret.taint_src && taint_src == 0)
			{
				ret.taint_src += taint_src
			}
		}

		//Check with args and obj and add to list
		if(args)
		{
			let tmpList = __internal_extractList__(result, args);

			if(tmpList.length > 0)
			{
				for(let i=0; i<tmpList.length; i++)
				{
					if(!ret.taint_list.includes(tmpList[i]))
					{
						ret.taint_list.push(tmpList[i]);
					}
				}
			}
		}		

		if(obj)
		{
			let tmpList = __internal_extractList__(result, obj);

			if(tmpList.length > 0)
			{
				for(let i=0; i<tmpList.length; i++)
				{
					if(!ret.taint_list.includes(tmpList[i]))
					{
						ret.taint_list.push(tmpList[i]);
					}
				}
			}
		}

		if(args==null && obj==null)
		{
			ret.taint_list.push(result);
		}
	}
	else if(typeof(result) == "object")
	{
		if(Array.isArray(result))
		{
			for(var k in Object.keys(result))
			{
				if(result[k])
				{
					ret[k] = __internal_taintResult__(result[k], args, obj, taint_src);
				}
			}
		}
		else
		{
			for(let prop in result)
			{	
				if(typeof(result[prop]) != "function")
				{
					var tainted = __internal_taintResult__(result[prop], args, obj, taint_src);
					Object.defineProperty(ret, prop, {value: tainted});
				}
			}
		}
	}
	else
	{
		//console.log("Invalid Type: ", typeof(result));
	}

	return ret;
}

function __internal_checkTaintArgument__(arguments)
{
	if(!arguments)
	{
		return 0;
	}

	if(arguments instanceof String)
	{
		if(arguments.taint)
		{
			return true;
		}
	}

	for(let i=0; i<arguments.length; i++)
	{
		if(typeof(arguments[i]) != "string" && arguments[i])
		{
			if(arguments[i].taint)
			{
				return arguments[i].taint_src;
			}

			let args_ret = __internal_checkTaintArgument__(arguments[i]);
			if(args_ret)
			{
				return args_ret;
			}
		}
	}
	
	return 0;
}

function __internal_isObjectTainted__(obj)
{
	if(!obj)
	{
		return false;
	}

	if(typeof(obj) == "string" || typeof(obj.valueOf()) == "string")
	{
		if(obj.taint)
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	else if(typeof(obj) == "object")
	{
		for(let k in Object.keys(obj))
		{
			if(__internal_isObjectTainted__(obj[k]))
			{
				return true;
			}
		}

		if(obj.taint)
		{
			return true;
		}
	}
	else
	{

	}

	return false;
}

function __internal_bogusFn__()
{
	
}

function __internal_registerHandler__(stage, contextKey)
{
	let CALLlistener = stage.addListener(Iroh.CALL);
	let FNlistener = stage.addListener(Iroh.FUNCTION);
	let BINlistener = stage.addListener(Iroh.BINARY);
	let MEMlistener = stage.addListener(Iroh.MEMBER);
	let NEWlistener = stage.addListener(Iroh.OP_NEW);
	let IFlistener = stage.addListener(Iroh.IF);
	let TERNlistener = stage.addListener(Iroh.TERNARY);
	let SWITCHlistener = stage.addListener(Iroh.SWITCH);
	let CASElistener = stage.addListener(Iroh.CASE);

	SWITCHlistener.on("test", t => {
		if(__internal_takenPath__.length > 0)
		{
			let taken_entry = __internal_takenPath__.shift();

			if(taken_entry.type == "Switch")
			{
				t.value = taken_entry.taken;
			}
			else
			{
				__internal_pushResult__("[Error] Invalid path taken");
			}
		}
	});

	CASElistener.on("test", t => {
		if(__internal_takenPath__.length > 0)
		{
			let taken_entry = __internal_takenPath__.shift();

			if(taken_entry.type == "Case")
			{
				t.value = taken_entry.taken;
			}
			else
			{
				__internal_pushResult__("[Error] Invalid path taken");
			}
		}
	});

	IFlistener.on("test", t => {
		if(__internal_takenPath__.length > 0)
		{
			let taken_entry = __internal_takenPath__.shift();

			if(taken_entry.type == "If")
			{
				t.value = taken_entry.taken;
			}
			else
			{
				__internal_pushResult__("[Error] Invalid path taken");
			}
		}
		else
		{
			__internal_pushResult__("[Error] Invalid path taken");
		}
	});

	

	TERNlistener.on("test", t => {
		let taken_entry = __internal_takenPath__.shift();

		if(taken_entry.type == "Ternary")
		{
			if(taken_entry.taken == "true")
			{
				t.result = t.truthy;
			}
			else
			{
				t.result = t.falsy;
			}
		}
		else
		{
			__internal_pushResult__("[Error] Invalid path taken");
		}
	});

	NEWlistener.on("before", fn => {
		let taint = __internal_checkTaintArgument__(fn.arguments);

		if(taint)
		{
			if(fn.name == "Function")
			{
				__internal_pushResult__("[FATAL] A Function argument contains tainted value. " + __internal_obj2str__(fn.arguments));
			}
			__internal_2bTaint__[fn.hash] = {arguments: fn.arguments, taint_src: taint, taint_list: []};

			for(let i=0; i<fn.arguments.length; i++)
			{
				if(fn.arguments[i] && fn.arguments[i].taint)
				{
					for(let j=0; j<fn.arguments[i].taint_list.length; j++)
					{
						__internal_2bTaint__[fn.hash].taint_list.push(fn.arguments[i].taint_list[j]);
					}
					fn.arguments[i] = fn.arguments[i].valueOf();
				}
			}
		}
	});

	NEWlistener.on("after", fn => {
		if(__internal_2bTaint__[fn.hash])
		{
			fn.return = __internal_taintResult__(fn.return, __internal_2bTaint__[fn.hash].arguments, null, __internal_2bTaint__[fn.hash].taint_src);
			fn.return.taint = true;
			fn.taint_src = __internal_2bTaint__[fn.hash].taint_src;
			fn.taint_list = __internal_2bTaint__[fn.hash].taint_list;
			delete __internal_2bTaint__[fn.hash];
		}
	});


	CALLlistener.on("before", fn => {
		//Re-route IDB access to our controlled IDB
		/*if(fn.object && fn.object.constructor && fn.object.constructor.name == "IDBFactory")
		{
			if(fn.name == "open")
			{
				fn.arguments = [location.origin];
			}
		}
		else if(fn.object && fn.object.constructor && fn.object.constructor.name == "IDBDatabase")
		{
			if(fn.name == "transaction")
			{
				fn.arguments[0] = "store";
			}
		}
		else if(fn.object && fn.object.constructor && fn.object.constructor.name == "IDBTransaction")
		{
			if(fn.name == "objectStore")
			{
				fn.arguments[0] = "store";
			}
		}*/

		//Identify tainted arguments of sensitive sinks 
		if(fn.callee == "eval")
		{
			if(__internal_checkTaintArgument__(fn.arguments))
			{
				__internal_pushResult__("[FATAL] An Eval argument contains tainted value. " + __internal_obj2str__(fn.arguments));
			}
		}
	});

	CALLlistener.on("after", fn => {
		let tainted = __internal_checkTaintArgument__(fn.arguments) | __internal_isObjectTainted__(fn.object);

		if(tainted)
		{
			fn.return = __internal_taintResult__(fn.return, fn.arguments, fn.object, tainted);	
		}

		if(fn.object && fn.object.constructor && fn.object.constructor.name == "URLSearchParams")
		{
			if(fn.name == "get" || fn.name == "getAll" || fn.name == "toString")
			{
				fn.return = __internal_taintResult__(fn.return, fn.arguments, fn.object, 1);
			}
		}
	});

	FNlistener.on("enter", fn => {
		__internal_fnArgument__[fn.hash] = fn.arguments;
	});

	FNlistener.on("return", fn => {
		let tainted = __internal_checkTaintArgument__(__internal_fnArgument__[fn.hash]);

		if(tainted)
		{
			fn.return = __internal_taintResult__(fn.return, fn.arguments, null, tainted);
		}
	});

	BINlistener.on("fire", b => {
		if(typeof(b.result) == "string")
		{
			if(typeof(b.left) == "string" || typeof(b.left) == "object")
			{
				if(b.left.taint == true)
				{
					b.result = __internal_taintResult__(b.result, b.left, b.right, b.left.taint_src);
				}
			}

			if(typeof(b.right) == "string" || typeof(b.right) == "object")
			{
				if(b.right.taint == true)
				{
					b.result = __internal_taintResult__(b.result, b.left, b.right, b.right.taint_src);
				}
			}
		}
		else if(typeof(b.result) == "object")
		{
			if(typeof(b.left) == "string" || typeof(b.left) == "object")
			{
				if(b.left.taint == true)
				{
					b.result = __internal_taintResult__(b.result, b.left, b.right, b.left.taint_src);
				}
			}

			if(typeof(b.right) == "string" || typeof(b.right) == "object")
			{
				if(b.right.taint == true)
				{
					b.result = __internal_taintResult__(b.result, b.left, b.right.taint_src);
				}
			}
		}

		if(b.result.taint_list)
		{
			if(b.result.taint_list.length > 1)
			{
				let index = b.result.taint_list.indexOf(b.result.valueOf());
				
				if(index != -1)
				{
					b.result.taint_list.splice(index, 1);
				}
			}
		}
	});

	/*MEMlistener.on("fire", m => {
		if(typeof(m.object) != "function" && !Array.isArray(m.object))
		{
			if(m.object)
			{
				///Taint IDB entries
				if(m.object.constructor && m.object.constructor.name == "IDBRequest" && m.property == "result")
				{
					m.object.result = __internal_taintResult__(m.object.result, null, null, 2);
				}
			}
		}
	});*/
}
