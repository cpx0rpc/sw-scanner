var __internal_takenPath__ = [];

function __internal_registerPathHandler__(stage, contextKey)
{
	let IFlistener = stage.addListener(Iroh.IF);
	let TERNlistener = stage.addListener(Iroh.TERNARY);
	let SWITCHlistener = stage.addListener(Iroh.SWITCH);
	let CASElistener = stage.addListener(Iroh.CASE);
	let CALLlistener = stage.addListener(Iroh.CALL);

	CALLlistener.on("before", fn => {
		//Re-route IDB access to our controlled IDB
		if(fn.object && fn.object.constructor && fn.object.constructor.name == "IDBFactory")
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
		}
	});

	IFlistener.on("test", t => {
		__internal_takenPath__.push({taken: false, type: "If"});
	});

	IFlistener.on("enter", t => {
		__internal_takenPath__.pop();
		__internal_takenPath__.push({taken: true, type: "If"});
	});

	TERNlistener.on("test", t => {
		__internal_takenPath__.push({taken: t.result===t.truthy?"true":"false", type: "Ternary"});
	});

	SWITCHlistener.on("test", t => {
		//console.log("Switch Test: ", t.value, t.hash);
		__internal_takenPath__.push({taken: t.value, type: "Switch"});
	});
	CASElistener.on("test", t => {
		//console.log("Case Test: ", t.value, t.hash);
		__internal_takenPath__.push({taken: t.value, type: "Case"});
	});
	CASElistener.on("enter", t => {
		//console.log("Entering case: ", t.hash);
	});
}
