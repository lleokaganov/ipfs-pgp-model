
async function IPFS_need() { if(typeof 'IPFS' !== 'object') await LOADS_promice(['js/IPFS.js','js/ipfs.js']); } // Грузим IPFS

G6={
    answer(ids,opt) {
	clean('ziparch');
console.log(ids,opt);
	UPLOAD.win(ids,opt);
    },

    backupAcc: async function(acc_id) {
	const seed = DOT.accs.find(a => a.acc === acc_id).seed;
	ohelpc('Backup',`Backup secret`,
	    `<div class='r' onclick="cpbuf(this.innerHTML.replace(/<[^>]+>/g,''))">
	    <b>Account: </b> <tt>${acc_id}</tt>`
	    + ( seed ? `<hr><b>Seed:</b> <tt>${seed}</tt>`:'' )
	    +`<hr><b>Private:</b><pre>` + f5_read(`PGP_private_${acc_id}`)+'</pre>'
	    +`<hr><b>Public:</b><pre>` + f5_read(`PGP_public_${acc_id}`)+'</pre>'
	    +`</div>`
	);
    },

    delAcc: async function(acc_id) {
	if(!confirm('Delete account?')) return;
	salert('TODO',200);
	// Del Identity
        var tx = DOT.nodes[DOT.CUR].api.tx.identity.clearIdentity();
	var trans_hash = await G6.tx(tx,acc_id);
	if(!trans_hash) log.err('IDENTITY clear: error');
	else log.ok('IDENTITY clear: '+ G6.toHex(trans_hash));

	// Revoke key
        tx = DOT.nodes[DOT.CUR].api.tx.postman.revokeKey();
	trans_hash = await G6.tx(tx,acc_id);
	if(!trans_hash) log.err('Key revoke: error');
	else log.ok('Key revoked: '+ G6.toHex(trans_hash));
    },

    www_Friends: async function(acc_id,act) {
	if(act=='del') {
	    UPLOAD.friends = UPLOAD.friends.filter(item => item !== acc_id);
	} else {
	    if(UPLOAD.friends.includes(acc_id)) return;
    	    UPLOAD.friends.push(acc_id);
	}
        var o=''; for(var x of UPLOAD.friends) {
            o += `<div style="display:flex; align-items:center; gap:10px;">`
		+ await G6.www_acc({ acc: x })
		+ `<div class="mv" onclick="G6.www_Friends('${x}','del')">❌</div>`
		+`</div>`;
        }
        dom('freindZone',o);
    },

    www_changeAcc: async function() {
        var o = `<div><b>Select account</b></div>`;
        for(var x of DOT.accs) o+= `<div style="display:flex; align-items:center; gap:10px;">
<div class='mv0' onclick="G6.delAcc('${x.acc}')">❌</div>
<div onclick="G6.selectAcc('${x.acc}');clean('changeacc');">` + await G6.www_acc(x) +`</div>
<div class='mv0' onclick="G6.backupAcc('${x.acc}')">💾</div>
</div>`;

	ohelpc('changeacc','Change Acc '+h(DOT.current_acc.name), o +`<input type="button" onclick="clean('changeacc'); G6.newAcc();" value="Create new">`);
    },

    www_acc: async function(r) {
	    if(!r.info) r.info = await G6.getIdentity(r.acc) || {};
            if(!r.name || r.name=='AutoCreated') r.name = '';


	    r.about = r.public_hash
		? `<a href='${IPFS.hex2url(r.public_hash)}' target='_blank' onclick="IPFS.view_url(this.href,'','txt'); return false;">${h(r.acc)}</a></div>`
		: h(r.acc)
	    ;

	    r.head = h( r.info.display || r.name || r.wallet || '' );
	    // if(r.wallet && r.wallet != 'localStorage') r.head = `<span class='br'>${h(r.wallet)}</span> ${r.head}`;
	    if(r.info?.email) r.head = `${r.head} <a href='mailto:${h(r.info.email)}'>${h(r.info.email)}</a>`;

            return `<div class="acc_card">
			<div>${G6.identicon(r.acc,30)}</div>
		        <div class="acc_content">
		            <div class="acc_title">${r.head}</div>
		            <div class="acc_id">${r.about}</div>
		        </div>
		</div>`;
    },

    identicon: function(acc,size) {
	if(!size) size=24;
	return `<div style='display:inline-block' class='mv0' onclick="G6.www_getInfo('${acc}')">${DOT.identicon_render(acc,size)}</div>`;
    },

    www_getInfo: async function(acc_id) {
	const opt = await G6.getIdentity(acc_id);
	if(!opt) return salert('no info',300);
	dier(opt);
    },

    getIdentity: async function(acc_id) {
	try {
	    if(!acc_id) acc_id = DOT.current_acc.acc;
	    ajaxon();
	    var r = await DOT.nodes[DOT.CUR].api.query.identity.identityOf(acc_id);
	    ajaxoff();
	    if(!r.isSome) return null;
    	    r = r.unwrap().toHuman()[0].info;
	    const opt={};
	    for(var name in r) {
		var s = r[name];
		if(typeof s === 'string') s=G6.raw(s);
		else if(typeof s.Raw === "string") s=G6.raw(s.Raw);
		else if(typeof s.length !== "undefined") {
		    s.forEach(x=>{
			opt[name+'_'+G6.raw(x[0])] = G6.raw(x[1]);
		    });
		    continue;
		}
		if(s && s!=="None") opt[name]=s;
	    }
	    console.log(opt);
    	    return opt;
	} catch(er) {
	    console.error(er);
	    ajaxoff();
	    return false;
	}
    },

    len: function(s) {
	return new TextEncoder().encode(s).length;
    },

    trimto: function(str, maxLength) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let encoded = encoder.encode(str);
        if (encoded.length > maxLength) encoded = encoded.slice(0, maxLength);
        return decoder.decode(encoded);
    },

    raw(s) {
	if(typeof s.Raw === "string") s=s.Raw;
	if( !(/^0x[0-9a-f]+$/i).test(s) ) return s;
        s = s.startsWith('0x') ? s.slice(2) : s;
        s = new Uint8Array(s.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const decoder = new TextDecoder('utf-8');
	return decoder.decode(s);
    },


    www_identity_form: function(opt) {
	return new Promise(function(resolve, reject) {
	        ohelpc('setidentity','Identity Form',`
<form id="identityForm">
    <h2>Required</h2>
    <div>Name: <input type="text" name="display" maxlength="32" required></div>
    <h2>Optional</h2>
    <div>Email: <input type="email" name="email" maxlength="32"></div>
    <div>Address: <input type="text" name="address" maxlength="32"></div>
    <div>Mobile: <input type="tel" name="telephoneNumber" maxlength="16"></div>
    <div>Bio: <input type="text" name="bio" maxlength="32"></div>
    <div>Website: <input type="url" name="website" maxlength="32"></div>
    <div>Telegram: <input type="text" name="telegram" maxlength="32"></div>
    <div>Discord: <input type="text" name="discord" maxlength="32"></div>
    <div>LinkedIn: <input type="text" name="linkedin" maxlength="32"></div>
    <div>Instagram: <input type="text" name="instagram" maxlength="32"></div>
    <div>Medium: <input type="text" name="medium" maxlength="32"></div>
    <div>YouTube: <input type="text" name="youtube" maxlength="32"></div>
    <div>GitHub: <input type="text" name="git" maxlength="32"></div>
    <div>Mastodon: <input type="text" name="mastodon" maxlength="32"></div>
    <button type="submit">Submit</button>
</form>`);
	    var q=dom('setidentity');
	    // расставить значения
	    if(opt) for(let i in opt) {
		const e = q.querySelector(`input[name='${i}']`);
		if(e) e.value = opt[i];
	    }

	    // не давать превысить значения
	    q.querySelectorAll('input').forEach(e => {
	        e.addEventListener('input', event => {
	            const maxLength = 1*e.getAttribute('maxlength');
	            if(G6.len(e.value) > maxLength) e.value = G6.trimto(e.value, maxLength);
		});
	    });

	    q.querySelector("button").addEventListener('click', (event,x) => {
		clean(q);
		const r={};
		q.querySelectorAll(`input`).forEach(e => r[e.name]=e.value.trim() );
		if(!r.display) return salert('Please enter Name',1000);
        	resolve(r);
	    });
	});
    },

    www_identity: async function(acc_id) {
	if(!acc_id) DOT.current_acc.acc;
	var opt = await G6.getIdentity(acc_id) || {};
	opt = await G6.www_identity_form(opt);
	console.log(opt);
	G6.setIdentity(acc_id,opt);
    },

    tx: async function(tx,acc_id) {
	if(!acc_id) acc_id = DOT.current_acc.acc;
	const acc = DOT.accs.find(a => a.acc === acc_id);
        var trans_hash = false;
        if(acc.pair) { // для сгенерированных кошелей
		trans_hash = await tx.signAndSend(acc.pair);
        } else { // для браузерных
		const injector = await polkadotExtensionDapp.web3FromAddress(acc.acc);
	        trans_hash = await tx.signAndSend(acc.acc, { signer: injector.signer });
        }
	return trans_hash;
    },

    setIdentity: async function(acc_id,opt) {
	if(!opt || !opt.display) return false;

	const identityInfo={}; for(let i in opt) identityInfo[i]={Raw:opt[i]};
	console.log(identityInfo);

        const tx = DOT.nodes[DOT.CUR].api.tx.identity.setIdentity(identityInfo);
	const trans_hash = await G6.tx(tx,acc_id);

	if(!trans_hash) log.err('IDENTITY save: error');
	else log.ok('IDENTITY: '+ G6.toHex(trans_hash));
    },

    toHex: function(data) {
	if(typeof data.toHex === 'function') return data.toHex();
        return '0x'+Array.from(data).map(byte => byte.toString(16).padStart(2, '0')).join('');
    },

    sleep: async function(ms) {
	    return new Promise(resolve => setTimeout(resolve, ms));
    },

    askAlice: async function(acc, min) {
        // ============= top up from Alice ==================
	const N = DOT.nodes[DOT.CUR];
	const old = await G6.balance(acc);
	DOT.Talert("Top up "+acc+" for "+DOT.indot(min,1));
	var keyring = new polkadotKeyring.Keyring({ type: 'sr25519' });
	if(!DOT.alice) DOT.alice = keyring.addFromSeed(polkadotUtil.hexToU8a("0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a"));
	const hash = await N.api.tx.balances.transferKeepAlive(acc, min).signAndSend(DOT.alice);
    	DOT.Talert('Transaction sent with hash '+hash);
	var balance = BigInt(0);
	while( BigInt(balance) < BigInt(old)+BigInt(min) ) {
	    log('waiting...');
	    await G6.sleep(1000);
	    balance = await G6.balance(acc);
	}
	return balance;
    },

    balance: async function(acc){
	log.set(`Balance for ${acc}`);
	const balance = await DOT.Balance(acc) || 0;
	log.ok(`Balance: ${balance}`);
	return balance;
    },

    connect: async function(){
	const N = DOT.nodes[DOT.CUR];
        log(`Connecting: ${N.rpc_url}`);
        await DOT.connect(undefined, 5000);

        if( !N.api ) {
	    log.err(`Failed`);
	    return false;
	}

	log.ok(`Connected: ${N.rpc_url} Get info`);

	var x;
            try { // decimals, name, symbol
                x = await N.api.rpc.system.properties();
                x = x.toHuman();
                N.decimals = DOT.intHuman(x.tokenDecimals[0]);
                N.symbol = x.tokenSymbol[0];
                N.ss58 = 1*(x.ss58Format); // если null, то и будет 0
            } catch(e){}

	x='decimals'; log.ok(`${x}: ${N[x]}`);
	x='symbol'; log.ok(`${x}: ${N[x]}`);
	x='ss58'; log.ok(`${x}: ${N[x]}`);

            try { // deposit
                N.deposit = DOT.intHuman( await N.api.consts.balances.existentialDeposit );
            } catch(e){}

	x='deposit'; log.ok(`${x}: ${N[x]}`);
	return true;
    },

    load_js: async function() {
	await LOADS_promice("DOT.js");
        await LOADS_promice("js/inter.css"); LOADES['https://rsms.me/inter/inter.css']=1; window.DOTLOADES=LOADES;

        DOT.cx.order_id = "0";
        DOT.cx.total = "1";
        DOT.cx.name = 'TEST';
        DOT.cx.ajax_url = mpers("https://shop-js.zymologia.fi/{action}",{action:'kalatori'});
        DOT.cx.mainjs = "js/";
        DOT.cx.currency = "DOT"; // SHOP_SET.CUR; // DOT
        DOT.cx.currences = "DOTL"; // SHOP_SET.CUR_ALLOWED; // DOTL USDC USDT
        DOT.onpaid = function(json,info) { salert('Paid success!',2000); } // выводим приветвие

         await DOT.LOADS_promice([
            DOT.cx.mainjs+'bundle-polkadot-util.js',
            DOT.cx.mainjs+'bundle-polkadot-util-crypto.js',
            DOT.cx.mainjs+'bundle-polkadot-extension-dapp.js',
            DOT.cx.mainjs+'bundle-polkadot-types.js',
            DOT.cx.mainjs+'bundle-polkadot-api.js',
            DOT.cx.mainjs+'bundle-polkadot-keyring.js', // west
	],1);

	DOT.Talert=function(s){log(s,'blue');};
	DOT.error=log.err;

	DOT.CUR = 'G6';
	DOT.nodes[DOT.CUR] = {
	    rpc_url: 'wss://node-g6.lleo.me', // 'ws://127.0.0.1:9949',
	};

	return DOT.nodes[DOT.CUR];
    },


    selectAcc: async function(acc_id) {
	// нашли, о чем речь
	var acc = DOT.accs.find(x => x.acc === acc_id);
	if(!acc) {
	    console.log('Unknown acc_id:', acc_id, DOT.accs, DOT.nodes.G6.ss58);
	    acc = DOT.accs[0];
	    acc_id = acc.acc;
	}
	// проверили и подтянули баланс
	await G6.topup(acc);
	// проверили, есть ли info
        if(!acc.info) acc.info = await G6.getIdentity(acc_id) || {};
	// проверили, есть ли имя
	if(!acc.info.display) {
	    // запросили форму и прописали имя
	    await G6.www_identity(acc_id);
	    // Ждем, пока пропишется
	    while(
		! (acc.info = await G6.getIdentity(acc_id))
		|| !acc?.info?.display
	    ) {
		log('waiting...');
		await G6.sleep(1000);
	    }
	}
	// проверили, есть ли приватник
	acc.pgp_private = f5_read(`PGP_private_${acc_id}`,'');
	acc.pgp_public = f5_read(`PGP_public_${acc_id}`,'');
	if(!acc.pgp_private || !acc.pgp_public) {
	    salert('Create PGP keys',1000);
            log.ok('Create new PGP-keys');
            const newkey = await PGP.create();
            f5_save(`PGP_public_${acc_id}`, acc.pgp_public = newkey.publicKey );
            f5_save(`PGP_private_${acc_id}`, acc.pgp_private = newkey.privateKey );
	}
	// проверили, опубликован ли публичник
        const x = await G6.read(acc.acc);
        if(x != acc.pgp_public) await G6.save(acc.pgp_public,acc);
	// и вот тогда только выбрали
        DOT.current_acc = acc;
	// запомнили выбор
	f5_save('current_acc',acc_id);
	// нарисовали в углу странички
	dom('my_current_account', await G6.www_acc(acc) );
    },

    topup: async function(acc) { // проверили подтянули баланс
	const N = DOT.nodes[DOT.CUR];
	// Прочли баланс
	acc.balance = await G6.balance(acc.acc);
	// Если нет денег - попросить у Алисы
	var min = BigInt(N.deposit*2000);
	if(BigInt(acc.balance) < min/BigInt(2)) acc.balance = await G6.askAlice(acc.acc, min);
    },

    // Ищем в памяти публичные ключи
    get_pgp_keys: function(acc_id) {
	var r = f5_read(`PGP_keys_${acc_id}`,'');
	try { r = JSON.parse(r); } catch(er) { r={}; }
	return r || false;
    },

    newAcc: async function() {
	// создали seed
	const seed = polkadotUtilCrypto.mnemonicGenerate();
	log.set('New seed: '+seed);

	ohelpc('saveseed','Save seed',`
Please save your seed:

<div style="padding:20px; border: 1px solid #ccc; border-radius:20px;font-size:16px;">
    <span class='mv' onclick="cpbuf('${seed}')">📋</span> ${seed}
</div>
`);
	// создаем аккаунт
	const acc = await G6.restoreAcc(seed);
        if(!acc) return false;
	// прописываем, закпоминаем
	DOT.accs.push(acc);
        DOT.seeds.push(seed);
        f5_save('G6.seed',JSON.stringify(DOT.seeds));
	// выбираем его (и там баланс и ключи проверят)
	await G6.selectAcc(acc.acc);
    },

    restoreAcc: async function(seed) {
	await polkadotUtilCrypto.cryptoWaitReady();
	const r={};
	if(!seed) return false;
	r.seed = seed;
	// Создание приватного ключа из мнемоники
	try {
	    r.miniSecret = await polkadotUtilCrypto.mnemonicToMiniSecret(seed);
	    G6.m = r.miniSecret;
	    r.miniSecretHex = G6.toHex(r.miniSecret);
	} catch(er) {
	    log.err('Error seed: '+er);
	    return false;
	}
	    log.ok('Private key: '+r.miniSecretHex );
	// Создание аккаунта через Keyring
	r.keyring = await new polkadotKeyring.Keyring({ type: 'sr25519' });
	r.pair = await r.keyring.addFromSeed(r.miniSecret);
	r.public = G6.toHex(r.pair.publicKey);
	r.acc = DOT.west(r.pair.address);
	    log('Public Key: '+ r.public);
	    log('Address: '+ r.acc);
	    log.bin(`<div>${G6.identicon(r.acc,24)}</div>`);
	return r;
    },

    read: async function(acc_id) {
	    log.set(`Read Key for ${acc_id}`);
	    const hash = await G6.read_CHAIN(acc_id);
	    if(!hash) return hash;
	    return await G6.read_IPFS( hash ); // public = IPFS(hash = CHAIN(acc))
    },

    read_CHAIN: async function(acc_id) { // hash = CHAIN(acc)
	    const N = DOT.nodes[DOT.CUR];
	    log.set(`CHAIN: reading hash for ${acc_id}`);
	    const key = await N.api.query.postman.keys(acc_id);
	    if(key.isEmpty || G6.toHex(key) === '0x') {
		log.err("CHAIN: hash not found");
		return '';
	    }
	    log.ok('CHAIN: Hash '+ G6.toHex(key));
	    return G6.toHex(key);
    },


    read_CHAIN_ALL: async function() { // hash = CHAIN(acc)
	    const N = DOT.nodes[DOT.CUR];
	    log.set(`CHAIN: reading ALL hashes`);
	    const keys = await N.api.query.postman.keys.entries();
	    // console.log('keys',keys);
	    // G6.K=keys;
	    // var r=keys.map(x=>{x[0].toHuman():x[1].toHuman()});
	    const r={}; keys.forEach(x => {
		const key = x[0].toHuman();
		const value = x[1].toHuman().public;
		r[key] = value;
	    });
	    console.log('r',r);
	    return r;
    },


    read_IPFS: async function(hash){ // public = IPFS(hash)
	    if(!hash) {
		log.err(`IPFS: Empty hash`);
		return null;
	    }
	    await IPFS_need();
	    log.set(`IPFS: reading Publik with hash ${hash}`);
	    const url = IPFS.hex2url(hash);
	    log.bin(`<br>IPFS: <a href='${url}' target='_blank'>${url}</a>`);
            const response = await fetch(url);
	    if(!response.ok) {
		log.err(`IPFS error: ${response.status}`);
		return false;
	    }
    	    const public = await response.text(); // Читаем содержимое как текст
	    log.ok(`Public key PGP: ${log.key(public)}`);
	    return public;
    },

    save: async function(public, acc) {
	    log.set(`Save Key for ${acc.acc}`);
	    return await G6.save_CHAIN( await G6.save_IPFS(public, acc.acc), acc ); // CHAIN ( hash = public -> IPFS )
    },

    save_IPFS: async function(public, acc) { // hash = public -> IPFS
	    log.set(`IPFS: save Public`);
	    await IPFS_need();
	    const cid = await IPFS.save(public,{type:"text/plain",name:acc+".public"});
	    if(!cid) {
		log.err('IPFS: Error cid');
		return false;
	    }
	    const hash = IPFS.cid2hex(cid);
	    if(!hash) {
		log.err('IPFS: Error hash');
		return null;
	    }
	    log.ok(`IPFS hash: ${hash}`);
	    return hash;
    },

    save_CHAIN: async function(hash, acc) { // hash -> CHAIN
	    if(!hash) {
		log.err(`CHAIN: Empty hash`);
		return null;
	    }
	    const N = DOT.nodes[DOT.CUR];
	    log.set(`CHAIN: save hash for ${acc.acc}`);

	    console.log('acc',acc);

	    const tx = N.api.tx.postman.publishKey(hash);
	    var trans_hash = false;
	    if(acc.pair) { // для сгенерированных кошелей
		trans_hash = await tx.signAndSend(acc.pair);
	    } else { // для браузерных
		const injector = await polkadotExtensionDapp.web3FromAddress(acc.acc);
	        trans_hash = await tx.signAndSend(acc.acc, { signer: injector.signer });
	    }

	    if(!trans_hash) log.err('CHAIN save: error');
	    else log.ok('CHAIN: '+ G6.toHex(trans_hash));

	    while( await G6.read_CHAIN(acc.acc) != hash ) {
		log('waiting...');
		await G6.sleep(1000);
	    }

	    return G6.toHex(trans_hash);
    },

};


log=function(s,color){
    const e=dom('.log_console');
    e.innerHTML = e.innerHTML + "<br>" + (color ? `<font color='${color}'>${h(s).replace(/\n/g,'<br>')}</font>` : h(s));
    e.scrollTo({ top: e.scrollHeight, behavior: 'smooth' });
};

log.bin=function(s){
    const e=dom('.log_console');
    e.innerHTML = e.innerHTML + s;
    e.scrollTo({ top: e.scrollHeight, behavior: 'smooth' });
};


log.set=function(s) { log(s,'orange'); }
log.ok=function(s) { log(s,'green'); }
log.err=function(s) { log(s,'red'); }
log.key=function(s) {
        if(PGP.test_public(s)) return "[OK: PGP PUBLIC KEY]";
        if(PGP.test_private(s)) return "[OK: PGP PRIVATE KEY]";
	return "error";
};

ZIP = {
    need: async function(){ if(typeof 'JSZip' !== 'object') await LOADS_promice('js/jszip.min.js'); },

    zip: {},

    unzip: async function(сontent) {
	await IPFS_need();
	await ZIP.need();
	try {
	    const zipData = await new JSZip().loadAsync(сontent);
	    const r = [];
	    for(const [fileName, file] of Object.entries(zipData.files)) {
                if(file.dir) continue; // Пропускаем папки
		const content = await file.async( name.toLowerCase().endsWith('.txt') ? "text" : "uint8array" );
		const type = IPFS.name2mime(fileName);
            	r.push({
		    name: fileName,
		    date: file.date,
		    content: content,
		    type: type,
		    // url: URL.createObjectURL(new Blob([content], { type: type })),
		    size: content.length,
		});
    	    }
	    return r;
	} catch(er) { console.error("ZIP unzip error: "+er); }
    },

    zip_files: async function(files) {
	await ZIP.need();
	const zip = new JSZip();
	for(const file of files) {
    	    const content = await file.arrayBuffer(); // Читаем содержимое файла
    	    zip.file(file.name, content); // Добавляем файл в архив
	}
	// Генерируем ZIP-файл
	return await zip.generateAsync({ type: "blob" });
    },
};


PGP = {
    need: async function(){ if(typeof 'openpgp' !== 'object') await LOADS_promice('js/openpgp.min.js'); },

    // Create new key pair: { privateKey, publicKey }
    create: async function() {
	await PGP.need();
	try {
    	    return await openpgp.generateKey({ userIDs: [{ name: '', email: '' }], curve: 'ed25519' });
	} catch(er) { console.error("PGP.create error: "+er); }
    },


    id: async function(key,all) { // key to id
	    await PGP.need();
	    var x = PGP.test_public(key);
	    if(x) x = await openpgp.readKey({ armoredKey: x });
	    else {
		x = PGP.test_private(key);
		x = await openpgp.readPrivateKey({ armoredKey: x });
	    }
	    if(!x) return '';

	    x = x.getKeys().map(k => k.getKeyID().toHex());
	    if(all) return x;
	    return x[1]?x[1]:x[0];
    },

    info: async function(content) {
	await PGP.need();
	const r={};
	try {
	    // Если текстовое, расшифровываем в бинарное
    	    if(typeof(content)=='string') content = await openpgp.readMessage({ armoredMessage: content });

	    console.log('content',content);
	    UPLOAD.content = content;

	    // Зашифрованы ли
	    r.encrypted = content.getEncryptionKeyIDs().length;
	    if(r.encrypted) {
		console.log("Encrypted: "+r.encrypted);
		r.encryptedKeys = content.getEncryptionKeyIDs().map(keyId => keyId.toHex());
		console.log("getEncryptionKeyIDs: ", content.getEncryptionKeyIDs());
		console.log("Encrypted for: ", r.encryptedKeys);

		// пытаемся расшифровать своим приватным ключом
		var my_private = f5_read('PGP_private_'+DOT.current_acc.acc,'');
		if(my_private) {
            	    var privateKey = await openpgp.readPrivateKey({ armoredKey: my_private });
		    if(privateKey.keyPacket?.isEncrypted) { // Ключ зашифрован
			var password = await PGP.get_password(my_private);
		        privateKey = await openpgp.decryptKey({ privateKey: privateKey, passphrase: password });
            	    }
		    const decryptedMessage = await openpgp.decrypt({ message: content, decryptionKeys: [privateKey],format: 'binary' });
		    console.log('decryptedMessage',decryptedMessage);
		//    content = await openpgp.readMessage({ binaryMessage: new Uint8Array(decryptedMessage.data) });
		    console.log('content2: ',content);
		}

	    } else {
		console.log("No encrypt");
	    }

	    r.signed = content.getSigningKeyIDs().length;
	    if(r.signed) {
		console.log("Signed: " + r.signed);
		r.signedKeys = content.getSigningKeyIDs().map(sig => sig.toHex());
		console.log("Signed for:", r.signedKeys);
	    } else {
		console.log("No sign");
	    }
	} catch(er) { console.error("PGP.info error: "+er); }
	return r;
    },


    // Функция шифрования бинарного файла
    // await PGP.encrypt(fileContent, {public: key, private: key, password }); // {public: [key1, key2, ...]});
    encrypt: async function(message, opt) {
	await PGP.need();
	try {
	    message = await openpgp.createMessage({ binary: new Uint8Array(message) }); // Создаем сообщение из бинарных данных

	    const format = opt.format || 'armored'; // 'binary' // Указываем формат вывода

	    // Если указаны приватные ключи - подписывать
    	    if(opt.private) {
        	if(typeof opt.private === 'string') opt.private = [opt.private];
		opt.private = [...new Set(opt.private)]; // удалим дубли
        	opt.sign = []; // Инициализируем массив для ключей подписи
        	for(let i=0; i<opt.private.length; i++) {
            	    var key = await openpgp.readPrivateKey({ armoredKey: opt.private[i] });
		    if(key.keyPacket?.isEncrypted) { // Ключ зашифрован
			opt.password = opt.password || await PGP.get_password(opt.private[i]);
			key = await openpgp.decryptKey({privateKey:key,passphrase:opt.password});
            	    }
            	    opt.sign.push(key);
        	}
    	    }


	    // Если указаны публичные ключи - шифровать
	    if(opt.public) {
    		if(typeof opt.public == 'string') opt.public = [opt.public];
		opt.public = [...new Set(opt.public)]; // удалим дубли
    		opt.enc = [];
		for(let i=0;i<opt.public.length;i++) {
		    const key = await openpgp.readKey({ armoredKey: opt.public[i] })
		    opt.enc.push( key );
		}
	    }

	    // Сперва подписываем сообщение, если требуется
	    if(opt.sign) {
		message = await openpgp.sign({
		    message: message,
		    signingKeys: opt.sign,
		    format: opt.enc ? "binary" : format, // Если будет шифрование, оставляем binary
		});
		// Преобразуем подписанное сообщение обратно в объект Message
	        if(opt.enc) message = await openpgp.readMessage({ binaryMessage: message }); // обратно в формат // Для шифрования используем binaryMessage
	    }

	    // После шифруем сообщение, если требуется
	    if(opt.enc) {
		message = await openpgp.encrypt({
		    message: message,
		    encryptionKeys: opt.enc,
		    format: format, // Итоговый формат
		});
	    }

	    // https://docs.openpgpjs.org/

	    return message; // await openpgp.encrypt(ara);
	} catch(er) { console.error("PGP.encrypt error: "+er); }
    },

    // Функция для расшифровки PGP файла
    decrypt: async function(content,opt) {
	await PGP.need();
	try {
	    // Если текстовое, расшифровываем в бинарное
    	    if(typeof(content)=='string') content = await openpgp.readMessage({ armoredMessage: content });

	    const ara = {
        	message: content,
    		format: 'binary' // Указываем бинарный формат
	    };

	    // Приватные ключи - нечего и шифровать
    	    if(typeof opt.private === 'string') opt.private = [opt.private];
    	    ara.decryptionKeys = []; // Инициализируем массив для ключей подписи
    	    for(let i=0; i<opt.private.length; i++) {
            	    var privateKey = await openpgp.readPrivateKey({ armoredKey: opt.private[i] });
		    if(privateKey.keyPacket?.isEncrypted) { // Ключ зашифрован
			opt.password = opt.password || await PGP.get_password(opt.private[i]);
		        privateKey = await openpgp.decryptKey({ privateKey: privateKey, passphrase: opt.password });
            	    }
            	    ara.decryptionKeys.push(privateKey);
    	    }
    	    if(!ara.decryptionKeys.length) throw new Error('Error: no Private keys');

	    const { data: decryptedContent } = await openpgp.decrypt(ara);
	    return new Uint8Array(decryptedContent); // Преобразуем данные в Uint8Array
	} catch(er) {
	    er = 'PGP decrypt error: '+er;
	    console.error(er);
	    return er;
	}
    },

/*
    // Прочитать или спросить пароль
    get_password: async function(private) {
	var password = false;
	// если это мой собственный ключ, поискать сохраненным мой собственный пароль
	if( private == f5_read('pgp_private_key','')) password = f5_read('pgp_password',false);
	while(password===false) password = await PGP.www_password();
	return password;
    },


    // Спросить пароль в модальном окне
    www_password: function() {
	return new Promise(function(resolve, reject) {
	        ohelpc('pgp_password','Input PGP password',`<input type='text' width='60' class='pgp_password'> <input type='button' value='GO'>`);
	        var q=dom('pgp_password');
	        q.querySelector("input[type='button']").addEventListener('click', (event,x) => {
		    clean(q);
        	    resolve(q.querySelector("input.pgp_password").value);
		});
	});
    },
*/

    test_public: function(key) {
	return PGP.test(key,'-----BEGIN PGP PUBLIC KEY BLOCK-----','-----END PGP PUBLIC KEY BLOCK-----');
    },

    test_private: function(key) {
	return PGP.test(key,'-----BEGIN PGP PRIVATE KEY BLOCK-----','-----END PGP PRIVATE KEY BLOCK-----');
    },

    test: function(key,start,end) {
	if(typeof(key)!=='string') return false;
	key=key.trim();
	if(key.indexOf(start)!=0) return false;
	if( key.indexOf(end) + end.length != key.length ) {
	    console.log(`${end} \n ${key.indexOf(end)} + ${end.length} != ${key.length}`);
	    return false;
	}
	return key;
    },


    www_checkSign: function(url) {
	var e=window.event.target;
	alert(e.value+' '+url);
    },

};


UPLOAD = {

  // Показать файл PGP
  View: async function(url) {
// alert(1);
	// TODO ЧТО ЗА ЕБАНАЯ СУКА
//	console.log(`URL: ${url}`);
//	url = url.replace(/\/bafkr/g,'/bafyb');
//	console.log(`URL: ${url}`);
	// https://ipfs.lleo.me/bafkr4ia6u2mhnfdt5joxs6l7ytqbr2jfhedgzsq3xmrhioqbfotfptgvli
	// https://ipfs.lleo.me/bafyb4ia6u2mhnfdt5joxs6l7ytqbr2jfhedgzsq3xmrhioqbfotfptgvli

    const REPLY = url.split('/').pop();

    try {
        // 1. Скачать файл
	ajaxon();
	UPLOAD.time = {};
	UPLOAD.time.ms = performance.now();

//          const response = await fetch(url);
//	    if(!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
//    	    const encryptedText = await response.text(); // Читаем содержимое как текст

	    var encryptedText = '';
            var response = await fetch(url);
	    if(response.ok) encryptedText = await response.text(); // Читаем содержимое как текст

	    if(!response.ok || encryptedText.substring(0,2) != "# ") {
		url = url.replace(/\/bafkr/g,'/bafyb');
		response = await fetch(url);
		if(response.ok) encryptedText = await response.text(); // Читаем содержимое как текст
	    }
	    if(!response.ok || encryptedText.substring(0,2) != "# ") throw new Error(`HTTP error! Status: ${response.status}`);


	UPLOAD.time.load = performance.now()-UPLOAD.time.ms;

	// Мои собственные заголовки
	const FILE =
		((encryptedText.match(/\# FILE\:\s*(.+)/) || [])[1]?.trim())
		|| ((encryptedText.match(/\# PGP name\:\s*(.+)/) || [])[1]?.trim())
		|| null;
	console.log('FILE: ', FILE);

	const TO =
		((encryptedText.match(/\# TO\:\s*(.+)/) || [])[1]?.trim())
		|| ((encryptedText.match(/\# PGP recipients\:\s*(.+)/) || [])[1]?.trim())
	        || '';
	if(TO) console.log('TO: ['+TO+']');

	const FROM = ((encryptedText.match(/\# FROM\:\s*(.+)/) || [])[1]?.trim()) || '';
	if(FROM) console.log('FROM: ', FROM);

	const FROM_ADDR = ((encryptedText.match(/\# FROM_ADDR\:\s*(.+)/) || [])[1]?.trim()) || '';
	if(FROM_ADDR) console.log('FROM_ADDR: ['+FROM_ADDR+']');

	const DATE = ((encryptedText.match(/\# DATE\:\s*(.+)/) || [])[1]?.trim()) || '';
	if(DATE) console.log('DATE: ', DATE);

	const UNIXTIME = ((encryptedText.match(/\# UNIXTIME\:\s*(.+)/) || [])[1]?.trim()) || '';
	if(UNIXTIME) console.log('UNIXTIME: ', UNIXTIME);

	const signatures = ((encryptedText.match(/\# PGP signatures\:\s*(.+)/) || [])[1]?.trim()) || '';
	if(signatures) console.log('Signaturese:', signatures);

	// 1. Прочесть инфо
	const info = await PGP.info(encryptedText);
	console.log("info: ", info);



	// 3. Распаковать файл PGP своим нынешним ключом
	UPLOAD.time.ms = performance.now();
		const key = f5_read('PGP_private_'+DOT.current_acc.acc,'');
		const decryptedContent = await PGP.decrypt(encryptedText,{private:key});
	UPLOAD.time.decrypt = performance.now()-UPLOAD.time.ms;
	console.log("URL: ",url);
	console.log("ZIP: ",decryptedContent);
	ajaxoff();

	// Чистим мусор
	if(UPLOAD.zipfiles) UPLOAD.zipfiles.forEach(file => { if(file.url) URL.revokeObjectURL(file.url); }); // Удаляем ссылку blob://

	if(typeof(decryptedContent)==='string') { // Ошибка распаковки
	    UPLOAD.zipmessage = decryptedContent;
	    UPLOAD.zipfiles = [];
	} else {
	    await IPFS_need();
	    // Если это не ZIP-архив - просто скачать
	    if(!FILE.toLowerCase().endsWith('.zip')) {
    		// 3. Создать ссылку для скачивания
		IPFS.download(decryptedContent, FILE || 'decrypted_pgp_file');
		return;
	    }
	    // Распаковываем файлы ZIP
	    UPLOAD.time.ms = performance.now();
		UPLOAD.zipfiles = await ZIP.unzip(decryptedContent);
	    UPLOAD.time.unzip = performance.now()-UPLOAD.time.ms;
	    console.log("FILES: ",UPLOAD.zipfiles);
	    UPLOAD.zipmessage = '';
	}

	var o = `
<style>
    .fn {
        margin-top:3px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .fn_namea {
        padding: 1px 10px 1px 10px;
        border: 1px solid #ccc;
        background-color: #eee;
        border-radius: 15px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 1px 10px 1px 10px;
	cursor: pointer;
    }

    .fn_name {
        display: inline-block;
        font-size: 12px;
    }

    .typeicon {
        display: inline-block;
        padding: -5px 10px -5px 5px;
        font-size: 18px;
        margin: -5px 0 -5px 0;
    }

    .uploadme {
        display: inline-block;
        font-size: 18px;
    }

    .sigbut {
	font-size:10px;
	border-radius: 999px;
    }

    .pgpid {
	background-color: #ffeddf;
	display: inline-block;
	EEEborder: 1px solid #ccc;
	padding: 0 5px 0 5px;
	font-size:10px;
	border-radius: 999px;
    }

    .messagediv {
	margin:10px 0 10px 0;
        max-height: 300px; /* Максимальная высота элемента */
        overflow-y: auto; /* Включаем вертикальную прокрутку при превышении max-height */
        height: auto; /* Автоматическая высота для подстройки под содержимое */
        white-space: pre-wrap; /* Сохраняем перенос строк и пробелы */
        word-wrap: break-word; /* Перенос длинных слов */
        border: 1px solid #ccc; /* Для визуального отображения элемента */
        padding: 10px; /* Внутренние отступы */
        box-sizing: border-box; /* Учитываем отступы и границы в общей высоте */
	background-color: #f9f6d5;
	border-radius: 10px;
	font-size: 14px;
    }

    .imgpre {
	max-width: 150px;
	max-height:150px;
    }

</style>
	`;

	o+=`<div class='br'>load: ${UPLOAD.time.load}ms decrypt: ${UPLOAD.time.decrypt}ms unzip: ${UPLOAD.time.unzip}ms</div>`;

	// Если были получатели
	const me_name = h(DOT.current_acc.info.display);
	const me_addr = h(DOT.current_acc.acc);



	if(FROM) o+=`<div class='r'>FROM: `+h(FROM).replace(me_name,`<u>${me_name}</u>`)+`</div>`;
	if(UNIXTIME) {
	    const TO_ARR = TO.split(',').map(x=>`"${h(x.trim())}"`).join(',');
	    const REALDATE = unixtime2str(1*UNIXTIME);
		    o+=` <input type='button' value='ANSWER'     onclick='G6.answer(["${h(FROM_ADDR)}"          ],{FROM_ADDR:"${h(FROM_ADDR)}",FROM:"${h(FROM)}",DATE:"${REALDATE}",TO:[${TO_ARR}],REPLY:"${h(REPLY)}"})'>`
		      +` <input type='button' value='ANSWER ALL' onclick='G6.answer(["${h(FROM_ADDR)}",${TO_ARR}],{FROM_ADDR:"${h(FROM_ADDR)}",FROM:"${h(FROM)}",DATE:"${REALDATE}",TO:[${TO_ARR}],REPLY:"${h(REPLY)}"})'>`;
	}
	if(FROM_ADDR) o+=`<div class='r'>FROM_ADDR: `+h(FROM_ADDR).replace(me_addr,`<u>${me_addr}</u>`)+`</div>`;

	if(DATE) o+=`<div class='r'>DATE HIS: `+h(DATE)+`</div>`;
	if(UNIXTIME) o+=`<div class='r'>DATE MY: `+unixtime2str(1*UNIXTIME)+` (UnixTime: `+h(UNIXTIME)+`)</div>`;

	if(TO) o+=`<div class='r'>TO: `+h(TO).replace(me_name,`<u>${me_name}</u>`)+`</div>`;

	if(info.encryptedKeys) o += `<div class='r'>info.encrypted: ` + info.encryptedKeys.map(id => `<div class='pgpid'>${id}</div>`).join(" ") + `</div>`;

	// Если были подписи
	if(signatures) {
	    var names = signatures.match(/"([^"]+)"/g).map(name => name.replace(/"/g, ""));
	    o += `<div class='r'>Signatures: `
		    +names.map(name => `<input type='button' class='sigbut' value='${h(name)}' onclick="PGP.www_checkSign('${h(url)}')">`).join(" ")
		    +`</div>`;
	}

	if(info.signedKeys) o += `<div class='r'>info.signed: `+info.signedKeys.map(id => `<div class='pgpid'>${id}</div>`).join(" ")+ `</div>`;


	const message = UPLOAD.zipfiles.find(file => file.name === 'message.txt');
	if(message) {
	    UPLOAD.zipfiles = UPLOAD.zipfiles.filter(file => file.name !== 'message.txt');
	    message.text = new TextDecoder('utf-8').decode(message.content);
	    o+= `<div class='messagediv'>${h(message.text)}</div>`;
	}

	if(UPLOAD.zipfiles.length) o += UPLOAD.zipfiles.map(x => {
	    var content;
	    if(x.type.indexOf('image/')>=0) {
		if(!x.url) x.url = URL.createObjectURL(new Blob([x.content], { type: x.type }));
		content = `<img src='${h(x.url)}' class='imgpre' onclick="UPLOAD.zipfilesView('${h(x.name)}')">`;
	    } else content = `<div class='fn_namea' onclick="UPLOAD.zipfilesView('${h(x.name)}')">
			<div alt='${x.type}' class='typeicon'>${IPFS.typece(x.type)}</div>
		        <div class='fn_name'>${h(x.name)}</div>
		    </div>${x.size}`;

	    return `<div class='fn'>
<div class='uploadme mv0' onclick="UPLOAD.zipfilesDownload('${h(x.name)}')">&#128190;</div>
${content}
</div>`;

	}).join('');

	if(UPLOAD.zipmessage) o+=`<u>Unable decode file<p>${h(UPLOAD.zipmessage)}`;

	G6.MES[REPLY]={
	    FROM: FROM,
	    FROM_ADDR: FROM_ADDR,
	    // REALDATE: REALDATE,
	    TEXT: message.text.substring(0,100),
	};
	f5_save('G6.MES',JSON.stringify(G6.MES));

	ohelpc('ziparch','Archive '+h(name),`<div style='max-width:500px'>${o}</div>`);

    } catch(er) { console.error('Error in View:', er); }
  },

  // Скачать файл из zip-архива
  zipfilesDownload: function(name) {
	const file = UPLOAD.zipfiles.find(f => f.name === name);
	IPFS.download(file.content,name);
  },

  // Показать файл из zip-архива
  zipfilesView: function(name) {
	const file = UPLOAD.zipfiles.find(f => f.name === name);
	if(!file.url) file.url = URL.createObjectURL(new Blob([file.content], { type: file.type }));
	IPFS.view_url(file.url,name,file.type);
  },

  relist_my: async function(){ // upload file list
    await IPFS_need();
    dom('ipfs-my-list','');
	try { IPFS.myfiles = JSON.parse(f5_read('ipfs_myfiles')); } catch(er) {} // включим кэш
	IPFS.myfiles = IPFS.myfiles || [];
	dom('ipfs-my-list',mpers(`
<table border='0' cellpadding='2' cellspacing='0' id='ipfs-my-list-table'>
{for(myfiles):
<tr hash='{#hash}' content-type='{#type}'>
<td>{i}</td>
<td><i alt='Delete from my' onclick='UPLOAD.DelMy()' class='e_cancel1 mv'></i></td>
<td><i alt='Delete' onclick='IPFS.Del(this)' class='e_cancel mv'></i></td>
<td><a class='r' onclick='return IPFS.View(this)' href='`+IPFS.endpoint+`{#hash}'>{#hash}</a></td>
<td><div>{case(name):
{false:}
{*:{#name}}
}</div><div class='br'>{#type}</div></td>
<td class='r leng'>{#leng}</td>
<td class='br'><a href='https://ipfs.io/ipfs/{#hash}' target='_blank'>ipfs.io</a></td>
</tr>
}
</table>
`,{myfiles:IPFS.myfiles}));

  },

  DelMy: function(hash){
    hash = hash || IPFS.find_tr().getAttribute('hash');
    IPFS.myfiles = IPFS.myfiles.filter(item => item.hash !== hash);
    f5_save('ipfs_myfiles',JSON.stringify(IPFS.myfiles));
    UPLOAD.relist_my();
  },

  AddMy: function(hash){
    IPFS.Type(hash,function(hash,type,leng,name){
	IPFS.myfiles.push({hash:hash,type:type,leng:leng,name:name});
        f5_save('ipfs_myfiles',JSON.stringify(IPFS.myfiles));
        UPLOAD.relist_my();
    });
  },

  copytomy: function(){
    var hash=IPFS.find_tr().getAttribute('hash');
    if(dom('ipfs-my-list-table').querySelector("TR[hash='"+hash+"']")) return;
    UPLOAD.AddMy(hash);
  },

  relist: async function(){ // upload file list
    await IPFS_need();
    dom('ipfs-list','');
    return await IPFS.List({
	    type:"exist",
	    nameonly: 1,
	    table_template: "<table border='0' cellpadding='2' cellspacing='0' id='ipfs-list-table'>{table}</table>",
	    template: `<tr hash='{#hash}'>
<td>{i}</td>
<td><i alt='Delete' onclick='IPFS.Del(this)' class='e_cancel mv'></i></td>
<td><a class='r' onclick='return IPFS.View(this)' href='{#url}'>{#hash}</a></td>
<td><i class='e_help'></i></td>
<td class='r'></td>
<td class='r leng'></td>
<td class='br'><a href='{#ipfsurl}' target='_blank'>ipfs.io</a></td>
<td class='br mv0' onclick='UPLOAD.copytomy()'>&#x2398;</td>
</tr>`
    });
  },



  showhash: function(hash){
    var ee=false;
    dom("ipfs-list-table").querySelectorAll("TR[hash='"+hash+"']").forEach(e=>{ ee=e; e.style.backgroundColor='green';});
    if(ee) ee.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  nowdate: function(){
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // месяцы с 0
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  },

  // Обработка файлов
  file_ready: async function(files,opt) {
    files = UPLOAD.upfiles;
    // opt = UPLOAD.upfiles_opt;

    try {
	// console.log('FILES:', files);

	// Заархивировали файлы ZIP
	const zipBlob = await ZIP.zip_files(files);

	// Присвоили сегодняшнее имя
	const fileName = UPLOAD.nowdate()+'_files.zip';

	var header=
		`# FROM: ${h(DOT.current_acc.info.display)}\n`
	      + `# FROM_ADDR: ${h(DOT.current_acc.acc)}\n`
	      + `# DATE: ${new Date().toLocaleString('en-GB',{timeZoneName:'short'}).replace(',','')}\n`
	      + `# UNIXTIME: ${Math.round(new Date().getTime()/1000)}\n`
	      + `# FILE: ${fileName}\n`;
	    ;

	const ara = {}; // опции шифрования

	// Кому шифруем публичными ключами?
        if(!UPLOAD.friends.length) return false;
	ara.public = [];
	for(var acc_id of UPLOAD.friends) {
	    const pk = PGP.test_public( await G6.read(acc_id) );
	    if(!pk) throw new Error(`Wrong format Public key for "${name}"`);
	    ara.public.push(pk);
	}
	ara.public = [...new Set(ara.public)]; // удалим дубли
	header += `# TO: `+ UPLOAD.friends.join(", ")+`\n`;

/*
	// Кто подписывает?
        if(UPLOAD.signatures.length) {
	    ara.private = UPLOAD.signatures.map(name => {
		const pk = PGP.test_private(EXAMPLE_PRIVATE[name]);
		if(!pk) throw new Error(`Wrong format Private key for "${name}"`);
		return pk;
	    });
	    ara.private = [...new Set(ara.private)]; // удалим дубли
	    header += `# PGP signatures: `+ UPLOAD.signatures.map(name => `"${name}"`).join(", ")+ `\n`;
	}
*/

        if(ara.public?.length || ara.private?.length) { // Если хоть кому-то шифруем или подписываем, то нам нужен PGP
	    // Читаем содержимое файла как ArrayBuffer
	    const fileContent = await zipBlob.arrayBuffer();
	    // Шифруем
            const encrypted = await PGP.encrypt(fileContent, ara);

	    if(!encrypted) throw new Error(`Wrong encrypted`);

	    // Заменяем объект file
	    var file = new File(
	        [header + encrypted], // Зашифрованное содержимое
	        fileName + '.pgp',  // Добавляем расширение для обозначения шифрования
	        { type: 'application/pgp-encrypted' } // Устанавливаем MIME-тип
	    );
	} else {
	    // Иначе просто file.zip без PGP
	    var file = new File([zipBlob], fileName, { type: zipBlob.type || "application/zip" });
	}

	var o = await UPLOAD.save( file ); // залили на IPFS
	console.log('o=',o);

	UPLOAD.upfiles = []; // сбросили массив
	clean('upload'); // убрали окно ввода файлов


        UPLOAD.AddMy(o.Hash); // добавили к своим файлам свеженький
	await UPLOAD.relist(); // перегрузили нашу общую таблицу
	UPLOAD.showhash(o.Hash); // Пометить новый файл зелененьким

	// Разослать уведомления
	const hash = IPFS.cid2hex(o.Hash);
	for(var acc_id of UPLOAD.friends) {
	    console.log('Mail to:',acc_id,hash);
	    if(! await PINGER.save(acc_id,hash) ) throw new Error(`PINGER error!`);
	}

	setTimeout(function(){ PINGER.www_check() },800);

    } catch(er) { console.error('Ошибка при шифровании файла:', er); }

  },




save: function(file,opt){

    const formData = new FormData();
    formData.append('file', file); // 'file' — имя поля, ожидаемого сервером
    return new Promise(function(resolve, reject) {
	// Отправляем файл на сервер
	fetch(IPFS.endpointSave, { method: 'POST', body: formData })
        .then((response) => {
            if(!response.ok) throw new Error('Network response was not ok ' + response.statusText);
            resolve(response.json()); // Если сервер возвращает JSON
        })
        .then((data) => {
            console.log('File uploaded successfully:', data);
	    resolve(data);
        })
        .catch((error) => {
            console.error('Error uploading file:', error);
	    reject(error);
        });
    });
},

  win: function(friends,opt) {

	// TODO: пока так, добавим наши ключи
	// FAKE.setme();

	ohelpc('upload','Write nerw message',`
	<style>
	    .filezone { border-radius: 8px; background-color: #f5f5f5; width: 350px; height: 50px; display: flex; align-items: center; justify-content: center; opacity: 0.8; }
	    .fileactive { background-color: #f5fff5 !important; opacity: 1.0 !important; }
    .textareaw {
      align-self: stretch;
      border-radius: 8px;
      border: 1px solid #356bff;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: flex-start;
      max-width: 100%;
	width: 350px;
      min-height: 40px; /* Минимальная высота */
      overflow: hidden;  /* Скрываем скролл */
    }

    .fn {
	margin-top:3px;
	font-size: 12px;
	display: flex;
	align-items: center;
	gap: 5px;
    }

    .fn_namea {
	padding: 1px 10px 1px 10px;
	border: 1px solid #ccc;
	background-color: #eee;
	border-radius: 15px;

	display: flex;
	align-items: center;
	gap: 6px;

	padding: 1px 10px 1px 10px;
    }


    .fn_name {
	display: inline-block;
	font-size: 12px;
    }

    .typeicon {
	display: inline-block;
	padding: -5px 10px -5px 5px;
	font-size: 18px;
	margin: -5px 0 -5px 0;
    }

    .delme {
	display: inline-block;
	font-size: 8px;
    }

    .replytext {
	padding: 5px;
	background-color: #fffbd8;
	border: 1px solid #ccc;
	border-radius: 10px;
	width: 350px;
    }

	</style>

	<!-- address to -->
	<div id='freindZone'></div>
	<input type='button' name="add_recipients" value="Add recipients" />
	<br>&nbsp;

	${!opt?.REPLY ?'': `
	<div class='br replytext'>${h(G6.MES[opt.REPLY].TEXT)}</div><br>&nbsp;`
	}
	<div><textarea class='textareaw' placeholder='text message'></textarea></div>

	<div class='filezone'>
            <img class="mv" src="img/download_2.svg" />
        </div>

        <div><input name="zone" style='display:none' type="file" accept="*/*" multiple /></div>

	<div class="fileplace"></div>



        <p><div><input type='button' name="save" style='display:none' value="Save" /></div>
	`);

/*
	<!-- address to -->

<p><table width='100%' border='0' style='font-size:10px'>
    <tr><th>Recepients:</th><th>Signature:</th></tr>
    <tr>
        <td width='50%'>
`+Object.keys(EXAMPLE_PUBLIC).map(name => `<div><label><input type='checkbox' ramsave='recipient_${h(name)}' style='margin-right:10px;'>${h(name)}</label></div>`).join('')+`
	</td>

	<td>
`+Object.keys(EXAMPLE_PUBLIC).map(name => `<div><label><input type='checkbox' ramsave='signature_${h(name)}' style='margin-right:10px;'>${h(name)}</label></div>`).join('')+`
	</td>
    </tr>
</table>

*/

        // Допустим, у нас есть массив публичных ключей получателей EXAMPLE_PUBLIC
    // Добавление опций в select

	const dropZone = dom('upload').querySelector(".filezone");
	const inputZone = dom('upload').querySelector("input[name='zone']");
	const inputSave = dom('upload').querySelector("input[name='save']");
	const textArea = dom('upload').querySelector("textarea");
	// const filePlace = dom('upload').querySelector(".fileplace");

	if(!friends || typeof friends !== 'object') {
	    // найти последний использованный список
	    try { friends=JSON.parse(f5_read('last_friends','')); } catch(er){ friends=[]; }
	}
	UPLOAD.friends=[];
	for(var friend_id of friends) G6.www_Friends(friend_id,'add');

	dom('upload').querySelector("input[name='add_recipients']").addEventListener('click', async (event) => {
	    var o = `<div><b>Friend's acounts:</b></div>`;
		// var duble = {}; // for(var x in DOT.accs) duble[x.acc]=1; // свои не учитываем
		if(!UPLOAD.all_keys) UPLOAD.all_keys = await G6.read_CHAIN_ALL();
		for(var acc_id in UPLOAD.all_keys) {
    		    o += `<div class='mv0' onclick="G6.www_Friends('${acc_id}');clean('friendList');">` + await G6.www_acc({ acc: acc_id }) +`</div>`;
		}
	    ohelpc('friendList','Select recipients',o);
	});


	textArea.addEventListener('input', (event) => {
	    inputSave.style.display = (textArea.value == '' ? 'none' : 'block');
	    // Сбрасываем высоту перед вычислением новой
	    textArea.style.height = 'auto';
	    // Устанавливаем высоту на основе прокручиваемой высоты
    	    textArea.style.height = Math.min(textArea.scrollHeight, 300) + 'px';

	    if(textArea.value) {
		const file = new File([textArea.value], UPLOAD.textname, { type: "text/plain" });
		UPLOAD.file_add([file]);
	    } else UPLOAD.file_del(UPLOAD.textname);
        });

	// При выборе файлов через диалог
        inputZone.addEventListener('change', (event) => {
	    dropZone.classList.add('fileactive');
	    UPLOAD.file_add( event.target.files );
        });

	// Событие dragover: предотвращаем стандартное поведение
        dropZone.addEventListener('dragover', (event) => {
	    event.preventDefault(); // Не даёт браузеру блокировать перетаскивание
            dropZone.classList.add('fileactive');
        });

	// Событие dragleave: возвращаем исходный стиль
        dropZone.addEventListener('dragleave', () => {
	    event.preventDefault();
	    dropZone.classList.remove('fileactive');
	});

	// Событие drop: получаем файлы
        dropZone.addEventListener('drop', (event) => {
	    event.preventDefault(); // Предотвращаем стандартное поведение браузера
	    dropZone.classList.add('fileactive');

	    const files = event.dataTransfer.files;
	    if(files.length > 0) {
    		console.log('Dropped files:', files);
		UPLOAD.file_add(files);
	    } else {
    		console.warn('No files were dropped!');
	    }
	});

        dropZone.addEventListener('click', (event) => {
	    inputZone.click();
	});

	inputSave.addEventListener('click', (event) => {
	    if(!UPLOAD.friends.length) return salert("Add recipients!",1000);
	    f5_save('last_friends',JSON.stringify(UPLOAD.friends));

	//    UPLOAD.recipients = [];
	//    UPLOAD.signatures = [];
	//    dom('upload').querySelectorAll("input[type='checkbox']").forEach(e=>{
	//	if(e.checked) {
	//	    const name = e.closest('label').textContent.trim();
	//	    if(e.getAttribute('ramsave').indexOf('recipient_')==0) UPLOAD.recipients.push(name);
	//	    else UPLOAD.signatures.push(name);
	//	}
	//    });
	    // dier( UPLOAD.recipients );
	    // dier( UPLOAD.signatures );
	    UPLOAD.file_ready();
	});

  },


  file_add: function(files) {

	    if(files) Array.from(files).forEach(file => {
	        const i = UPLOAD.upfiles.findIndex(f => f.name === file.name);
	        if(i < 0) UPLOAD.upfiles.push(file); else UPLOAD.upfiles[i] = file;
    	    });

	    dom('upload').querySelector(".fileplace").innerHTML = UPLOAD.upfiles.map(x => `<div class='fn'>
<div class='delme mv0' onclick="UPLOAD.file_del('${x.name}')">&#10060;</div>
<div class='fn_namea'>
    <div alt='${h(x.type)}' class='typeicon'>${IPFS.typece(x.type)}</div>
    <div class='fn_name'>${x.name}</div>
</div>
${x.size}
</div>`).join('');

	    dom('upload').querySelector("input[name='save']").style.display = (UPLOAD.upfiles.length ? 'block' : 'none');
  },

  file_del: function(name) {
	if(name === UPLOAD.textname) dom('upload').querySelector("textarea").value=''; // ибо нехуй! и понимания сути для.
	UPLOAD.upfiles = UPLOAD.upfiles.filter(f => f.name !== name);
	UPLOAD.file_add(false);
  },

  upfiles: [], // здесь будут файлы
  textname: "message.txt", // так будет назван файл текста из формочки

};



