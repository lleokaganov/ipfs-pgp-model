PINGER={
    mname: 'listMessage',

    showIPFS: function(change) {
	var show = f5_read('showlist','');
	if(change=='change') {
	    show = show=='YES' ? 'NO' : 'YES';
	    f5_save('showlist',show);
	}
	if(show=="YES") {
	    dom('ipfs_pole').style.display='block';
    	    UPLOAD.relist();
	    UPLOAD.relist_my();
	} else {
	    dom('ipfs_pole').style.display='none';
	}
    },

    www_animate: function(id) {
	const div = document.querySelector(`.mymail[pid='${id}']`);
        if(!div) return;
        div.classList.add('animate');
        setTimeout(() => { div.classList.remove('animate'); }, 2000);
    },

    www_check: async function() {
	ajaxon();
	await IPFS_need();
	var R = await PINGER.read(DOT.current_acc.acc);
	Object.entries(R).forEach(([id, time]) => { PINGER.add_mail(id,time); });
	if(Object.entries(R).length) plays('img/bbm_tone.mp3',2);
	dom('mail_work',
	    PINGER.allMail_flag ? PINGER.list_all_mail() : PINGER.list_new_mail() );
	ajaxoff();
    },

    fake_save: async function() {
	const account = '14ETeSygHv2VBQJSQuBWnzf1TujhfvxehcXHqEdEPxJqRw6o';
	const hexChars = '0123456789abcdef';
	let hash='0x'; for(let i=0; i<64; i++) hash += hexChars[Math.floor(Math.random() * hexChars.length)];
        await PINGER.save(account, hash);
    },

    api: async function(url) {
    	const r = await fetch(url,{method:'GET'});
        if(r.ok) return await r.text();
    },

    // https://site.lleo.me/ipfs-pgp-model5/pinger.php?action=save&account=14ETeSygHv2VBQJSQuBWnzf1TujhfvxehcXHqEdEPxJqRw6o&hash=0x01010101010101010101010101010101010101010101010101010
    save: async function(account,hash) {
	const r = await PINGER.api(`pinger.php?action=save&account=${account}&hash=${hash}`);
	return r == 'OK';
    },

    // https://site.lleo.me/ipfs-pgp-model5/pinger.php?action=read&account=14ETeSygHv2VBQJSQuBWnzf1TujhfvxehcXHqEdEPxJqRw6o
    read: async function(account,hash) {
	var r = await PINGER.api(`pinger.php?action=read&account=${account}`);
	try { return JSON.parse(r); } catch(er){ return false; }
    },


    readList: function(){
	try { return JSON.parse(f5_read(PINGER.mname,'')); } catch(er){ return []; }
    },

    saveList: function(r){
	try { f5_save(PINGER.mname,JSON.stringify(r)); } catch(er){}
    },

    add_mail: function(id,time) {
	var r = PINGER.readList();
	const item = r.find(x => x[0] === id);
        if(item) item[1] = time;
	else r.push([id,time,false]);
	PINGER.saveList(r);
	setTimeout(()=>{PINGER.www_animate(id);},10);
    },

    old_mail: function(id) {
	var r = PINGER.readList();
	const item = r.find(x => x[0] === id);
        if(item) item[2] = true;
	PINGER.saveList(r);
    },

    del_mail: async function(x) {
	// Удалить с IPFS
	try { IPFS.Del(IPFS.hex2cid(x),{onerror:function(){}}); } catch(er){}
	// Удалить из массива почты
	var r = PINGER.readList();
	r = r.filter(p => p[0] != x);

	    const pid = IPFS.hex2cid(x);
	    delete G6.MES[pid];
	    f5_save('G6.MES',JSON.stringify(G6.MES));

	PINGER.saveList(r);
    },

    list_new_mail: function() {
	var r = PINGER.readList();
	r = r.filter(x => x[2] === false);
	return PINGER.list_all_mail(r);
    },

    list_all_mail: function(r) {
	if(!r) r = PINGER.readList();
        return r.map(x => {
	    const pid = IPFS.hex2cid(x[0]);
	    const p=G6.MES[pid];
	    console.log('pid '+pid,p);
	    const add = !p ? '' : ` <b>${h(p.FROM)}</b><div class='br'>${h(p.TEXT.substring(0,50))}...</div>`;
	    return `<div class='mymail' pid='${x[0]}'>
<span class="mv" onclick="PINGER.del_mail('${x[0]}');clean(this.parentNode);">❌</span>
<span style='font-size:22px;' class='mv0'>${x[2]?'✉':'📧'}</span>
<a href='${IPFS.hex2url(x[0])}' target='_blank' onclick="PINGER.old_mail('${x[0]}'); UPLOAD.View(this.href); return false;">${unixtime2str(x[1])}</a>
${add}
</div>`;
        }).join('\n');
    },

};


async function INIT() {
    nonav = 1;

    dom('work',`
<style>
    /* Анимация: мигание фона */
    .mymail {
        transition: background-color 0.5s ease;
    }
    .mymail.animate {
	background-color: yellow; /* Цвет при анимации */
	animation: pulse 2s infinite; /* Анимация с повторением */
    }
    /* Ключевые кадры для эффекта мигания */
    @keyframes pulse {
	0% { background-color: yellow; }
        50% { background-color: orange; }
        100% { background-color: yellow; }
    }

    .log_console {
	margin:10px 0 10px 0;
        max-height: 150px; /* Максимальная высота элемента */
        overflow-y: auto; /* Включаем вертикальную прокрутку при превышении max-height */
        height: auto; /* Автоматическая высота для подстройки под содержимое */
        white-space: pre-wrap; /* Сохраняем перенос строк и пробелы */
        word-wrap: break-word; /* Перенос длинных слов */
        border: 1px solid #ccc; /* Для визуального отображения элемента */
        padding: 10px; /* Внутренние отступы */
        box-sizing: border-box; /* Учитываем отступы и границы в общей высоте */
	background-color: #f9f6d5;
	border-radius: 5px;
	font-size: 11px;
    }



/* Стили для общего блока */
.acc_card {
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 6px;
    background-color: #d8eaea;
    width: 350px;
    margin-bottom: 6px;
}

/* Стили для текстового содержимого */
.acc_content {
    margin-left: 6px;
    display: flex;
    flex-direction: column; /* Расположение текста друг под другом */
    justify-content: center; /* Выравнивание по вертикали */
}

/* Стили для заголовка */
.acc_title {
    font-size: 14px; /* Размер шрифта */
    font-weight: bold; /* Полужирный текст */
}

/* Стили для описания */
.acc_id {
    font-size: 10px; /* Размер текста для описания */
    color: #555; /* Серый цвет текста */
}

</style>


<div style="display:flex; align-items:center; gap:20px;">
	    <div id='my_current_account'></div>
	    <input type='button' value='Change' onclick='G6.www_changeAcc()'>
	    <input type='button' value='Edit' onclick="G6.www_identity()">
</div>

	    <div class='log_console'></div>

<div id='mail_work' style='font-size:12px;'></div>
<div style="display:flex; align-items:center; gap:20px;">
	    <input type='button' value='Show all' class='mv0' onclick="PINGER.allMail_flag=1; dom('mail_work',PINGER.list_all_mail())">
	    <input type='button' style='padding:10px' value='NEW MAIL' onclick="UPLOAD.win()">
	    <input type='button' value='Check Mail' onclick="PINGER.www_check()">
</div>

<div class='ll br' onclick="PINGER.showIPFS('change')">show ipfs details</div>
<div id='ipfs_pole' style='display:none'>
	    <p><div id='ipfs-my-list'></div>
	    <p><div id='ipfs-list'><div class='ll' onclick='UPLOAD.relist()'>View all</div></div>
</div>

	    <p><div id='polkadot_work' style='font-size:12px;'></div>
    `);

    log.set('Start');

    log('Load IPFS-files');
    await IPFS_need();
    IPFS.init_cache();

    PINGER.showIPFS();



    log('Load JS-librares');
    const N = await G6.load_js();

    // И первым делом connect, потому что иначе нихуя ss58 не прочтется
    log(`So, connected to CHAIN`,'magenta');
    while(! await G6.connect() ) {
	    var sysinfo = await fetch("https://site.lleo.me/messager/pinger.php?action=sysinfo");
	    if(!sysinfo.ok) log.err("[!] SERVER DOWN");
	    else {
		var sysinfo_text = await sysinfo.text(); // Читаем содержимое как текст
		log.err(`[!] SERVER INFO: ` + sysinfo_text.replace("/\n/g"," "));
	    }
	    await G6.sleep(3000);
    }

    console.log('ss58', DOT.nodes.G6.ss58);

    DOT.accs=[];

    // Ищем кошельки в Wallets
    log('Looking for Wallets');
    if(await DOT.init_wallets() && DOT.accs.length) log(`Wallets found: ${DOT.accs.length}`);
    else log('Wallets not found');

    // Ищем кошельки на борту
    log('Looking for localStore');
    DOT.seeds = [];
    try {
	DOT.seeds = f5_read('G6.seed','');
	DOT.seeds = JSON.parse(DOT.seeds);
    } catch(er) {
	DOT.seeds = typeof(DOT.seeds)=="string"? [DOT.seeds] : [];
    }
    for(const seed of DOT.seeds) {
        log(`Restore from seed: ${seed}`);
        var acc = await G6.restoreAcc(seed);
        if(acc) DOT.accs.push(acc);
    }

    // Если никаких кошельков не нашли, создать аккаунт
    if(! DOT.accs.length) {
	log(`Create new seed`,'magenta');
        if(! await G6.newAcc() || ! DOT.accs.length) return log.err(`Can't create new account`);
    }

    log(`So, you have ${DOT.accs.length} accounts`,'magenta');

    for(var x of DOT.accs) x.acc=DOT.west(x.acc); // Пересчитать под другой ss58

    // Если не выбрано аккаунта
    if(!DOT.current_acc) {
	const current_acc_id = f5_read('current_acc','');
	if(current_acc_id) await G6.selectAcc(current_acc_id);
	else await G6.selectAcc(DOT.accs[0].acc);
    }

    log.set(`Selected account: ${DOT.current_acc.name} ${DOT.current_acc.acc}`,'magenta');

    // Пришло время проверить нашу почту
    log.set('Check mail'); PINGER.www_check();

    log(`Done`,'magenta');

    try { G6.MES = JSON.parse(f5_read('G6.MES','')); } catch(er) { G6.MES={}; }

    setInterval(function(){PINGER.www_check()},10000);

}
