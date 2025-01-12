// page_onstart.push("IPFS.onready=function(){IPFS.List()};IPFS.init()");

IPFS={
// wss://node-shave.zymologia.fi

/*
endpoint: 'https://ipfs.zymologia.fi/', // proxy_pass http://127.0.0.1:8181;
endpoint_doc: 'https://ipfs.zymologia.fi/type_doc/', // proxy_pass http://127.0.0.1:8181;
endpointSave: 'https://ipfs.zymologia.fi/OOO_Add_IDDQD', // proxy_pass http://127.0.0.1:5001/api/v0/add?hash=blake3;
endpointRm: 'https://ipfs.zymologia.fi/OOO_Rm_IDDQD',
endpointLs: 'https://ipfs.zymologia.fi/OOO_ls',
*/

endpoint: 'https://ipfs.lleo.me/', // proxy_pass http://127.0.0.1:8181;
endpoint_doc: 'https://ipfs.lleo.me/type_doc/', // proxy_pass http://127.0.0.1:8181;
endpointSave: 'https://ipfs.lleo.me/OOO_Add_IDDQD', // proxy_pass http://127.0.0.1:5001/api/v0/add?hash=blake3;
endpointRm: 'https://ipfs.lleo.me/OOO_Rm_IDDQD',
endpointLs: 'https://ipfs.lleo.me/OOO_ls',


// сюда можно записать свою функцию при старте
onready: function(){},

// Загрузить библиотеку первым делом при старте страницы
init: async function() {
    if(typeof(mainjs)!='undefined') await LOADS_promice(mainjs+'ipfs.js');
    else await LOADS_promice('https://unpkg.com/multiformats/dist/index.min.js');
    IPFS.onready();
},

// перевести массив байт в строку вида "11 22 33 44 55 66 77 88 99 00 aa bb cc dd ee ff"
HEX: function(ara) {
    var o=[]; ara.forEach( (x)=> { o.push( (x >= 16 ? '':'0') + (x & 0xFF).toString(16) ); });
    return o.join(' ').toUpperCase();
},

// перевести массив байт в строку вида "0x11223344556677889900aabbccddeeff"
hex0x: function(ara) {
    var o="0x"; ara.forEach( (x)=> { o+=( (x >= 16 ? '':'0') + (x & 0xFF).toString(16) ); });
    return o;
},

// извлечь массив 32 байт из адреса ipfs
cid2bytes: function(url) {
    if(url.indexOf('/')>=0) {
	url=url.split('/');
	url=url[url.length-1];
    }
    return Multiformats.CID.parse(url).multihash.digest;
},

// перевести значимую часть 32 байта вдреса ipfs в строку вида "0x11223344556677889900aabbccddeeff"
cid2hex: function(url) {
    return IPFS.hex0x(IPFS.cid2bytes(url));
},

// перевести строку вида "0x11223344556677889900aabbccddeeff" в значимую часть 32 байта вдреса ipfs
hex2cid: function(hex) {
    hex = (30).toString(16)+(32).toString(16)+(''+hex).replace(/^0x/g,'');
    const x = Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    return Multiformats.CID.createV1(85,{bytes: x}).toString();
},

// добавить в начале https://ipfs.zymologia.fi/
hex2url: function(hex) {
    return IPFS.endpoint+IPFS.hex2cid(hex);
},

// по хэшу найти верхний объект TR в таблице вьювера ipfs-list-table
find_tr: function(e) {
    if(!e) e=window.event.target;
    if(typeof(e)=='object') return (e.nodeName == 'TR' ? e : e.closest('TR') );
    if(typeof(e)!='string') return console.error("find_tr: not String");
    var x=(dom('ipfs-list') || document).querySelector("TR[hash='"+e+"']"); if(x) return x;
    if(e.indexOf('://')<0) e=IPFS.endpoint+e;
    return dom('ipfs-list-table').querySelector("A[href='"+e+"']").closest('TR');
},

// вернуть точно хэш (даже если это был объект)
find_hash: function(hash) {

    if(!hash) hash=window.event.target;

    if(window.event) {
        window.event.stopPropagation(); // предотвращает всплытие события к родителям.
        window.event.preventDefault(); // предотвращает действие по умолчанию для ссылки, формы
    }

    if(typeof(hash)=='object') {
	var x=hash.getAttribute('hash'); if(x) return x;
	hash=IPFS.find_tr(hash);
	x=hash.getAttribute('hash'); if(x) return x;
	hash = hash.querySelector('A').href;
    }

    // console.log(hash);
    IPFS.LH = hash;
    return hash.replace(/^.*\//g,'');
},

// Удаление с Веба
Del: function(hash) {
    if(!confirm('Delete?')) return;
    hash=IPFS.find_hash(hash);
    AJAX(IPFS.endpointRm,{
    callback:function(o){
	console.log('Ok callback');
	// dier(o);
	salert('ok',300);
	try {
	    var j=JSON.parse(o).Pins;
	    if(j.length!=1) do_catch_error();
	    clean( IPFS.find_tr( j[0]) );
	    clean('ipfs-view');
	} catch(er){ alert('error: '+er); }

	try { UPLOAD.DelMy(hash) } catch(er){}
    },
    onerror:function(o,u,s){
	console.log('Error onerror');
	try { o=print_r(JSON.parse(o));	} catch(er){ o=h(o); }
	ohelpc('idie2',
	    red(h(this.status)+' '+h(IPFS.statusText)),
	    h(this.responseURL)+'<br>[ '+print_r(s)+' ]<br>'+o.replace(/\n/g,'<br>')
	);
    },
    noajax:1
    }, {arg:hash} );
},

// Методом HEAD получить content-type и 'content-length' и выполнить с ними заданную fn()
Type: async function(hash,fn) {
    hash=IPFS.find_hash(hash);

    if(IPFS.type_cache && IPFS.type_cache[hash]) { // если есть в кеше
	var [leng, type] = IPFS.type_cache[hash];
	return fn(hash,type,leng);
    }

    try {
        const response = await fetch(IPFS.endpoint+hash, { method: 'HEAD' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        // console.log('Response Headers:', [...response.headers.entries()]);
	var type=response.headers.get('content-type').replace(/;.+/g,'');
	var leng=response.headers.get('content-length');
	var name=false;
	if(leng===null) leng='';
        // if(hash=='bafyb4iame7mlfhwxyd5vstfclifrnhzuzv22xkrysoghwg57yn3xe7u4sm') console.log(hash,type,leng);

	if(type=='text/plain'||type=='application/pgp-encrypted') {
            // Читаем первые 500 байт
            const textResponse = await fetch(IPFS.endpoint+hash, { headers: { Range: 'bytes=0-1024' } }); // Заголовок для диапазона байт
            if(!textResponse.ok && textResponse.status !== 206) throw new Error(`Failed to fetch range: ${textResponse.status}`);
    	    const txt = await textResponse.text(); // Преобразуем ответ в текст
	    if(txt.indexOf('--BEGIN PGP MESSAGE--')>=0) type='application/pgp-encrypted';
	    name = ((txt.match(/\# PGP name\:\s*(.+)/) || [])[1]?.trim()) || null;

/*
# PGP name: 20241228-040144-599185061.png
# PGP time: 28/12/2024 04:01:44 GMT+3
# PGP date: 06/01/2025 15:43:59 GMT+3
-----BEGIN PGP MESSAGE-----
*/
            // console.log('First 500 bytes:', txt);
	}
	if(IPFS.type_cache) {
		IPFS.type_cache[hash]=[leng,type]; // запомним
		f5_save('ipfs_type_cache',JSON.stringify(IPFS.type_cache));
	}
	console.log(`fn(${hash},${type},${leng},${name});`);
	fn(hash,type,leng,name);
    } catch (er) { console.error('Error fetch:', er); }
},

// Веб-вьювер текстовых файлов
ViewFile: function(type,url) {
    AJAX(IPFS.endpoint+url,function(o){
	o=h(o).replace(/\n/g,'<br>');
	if(type.indexOf('unknown')>=0) o="<div class='br'>"+o+"</div>";
	var header="<i alt='Delete' onclick=\"IPFS.Del('"+url+"')\" class='e_cancel mv'></i>&nbsp;"+h(type);
	ohelpc('ipfs-view',header,o);
    });
},

HtmlView: function(html,hash,type) {
    IPFS.viewer("<i alt='Delete' onclick=\"IPFS.Del('"+hash+"')\" class='e_cancel mv'></i>&nbsp;"+h(type),html);
},

PageView: function(url,hash,type) {
    IPFS.viewer("<i alt='Delete' onclick=\"IPFS.Del('"+hash+"')\" class='e_cancel mv'></i>&nbsp;"+h(type),
	`<iframe src="${url}" frameborder='0' style="width:95vw;height:95vh" onload="center('ipfs-view','max')"></iframe>`
//	`<iframe src="${url}" frameborder='0' style="max-width:100%;max-height:100%" onload="center('ipfs-view','max')"></iframe>`
    );
},

GoogleView: function(url,hash,type) {
    url = "https://docs.google.com/gview?embedded=true&url="+encodeURIComponent(url);
    IPFS.PageView(url,hash,type);
},

viewer: function(header,html) {
    ohelpc('ipfs-view',header,html);
    center('ipfs-view','max');
    init_tip(dom('ipfs-view'));
},

viewer_iframe: function(name,url) {
//    IPFS.viewer(name,`<iframe src="${url}" frameborder='0' style="max-width:95vw;max-height:95vh" onload="center('ipfs-view','max')"></iframe>`);
    IPFS.viewer(name,`<iframe src="${url}" frameborder='0' style="width:95vw;height:95vh" onload="center('ipfs-view','max')"></iframe>`);
},

// Вьювер всех файлов (для текстовых вызовет ViewFile)
View: function(e,hash,name) {

    if(!e) e=window.event.target;
    else if(e && e.target) e=e.target;

    if(e.preventDefault) e.preventDefault();

    if(!hash) hash=e.getAttribute('hash');
    if(!name) name=e.getAttribute('name'); if(!name) name=e.textContent.replace(/<!--.*?-->/g,'').trim();
    if(!hash || !name) {
        e=IPFS.find_tr(e);
	hash=IPFS.find_hash(e);
	name=e.getAttribute('name');
    }
    var url=IPFS.endpoint+hash;
    if(!name) {
        var type=e.getAttribute('content-type') || 'text/plain';
        if(type.startsWith('audio/')) name='mp3';
	else if(type.startsWith('video/')) name='mp4';
        else if(type.startsWith('image/')) name='jpg';
        else if(type=='application/msword') name='doc';
        else if(type=='application/x-ole-storage') name='doc';
        else if(type=='application/pdf') name='pdf';
	else if(type=='text/rtf') name='rtf';
        else if(type.startsWith('text/')) name='txt';
	else if(type=='application/pgp-encrypted') name='pgp';
	else name='unknown';
    }
    IPFS.view_url(url,name);
    return false;
},

view_url: function(url,name,type) { // type in [image video audio text document archive]
    if(!name) name=url;
    if(!type) type = name.split('.').pop().toLowerCase();

    if(['jpg', 'gif', 'png', 'webp', 'jpeg', 'svg'].includes(type)) {
	IPFS.viewer(name, mpers(`<img src="{#url}" style="max-width:100%;max-height:100%" onload="center('ipfs-view','max')">`,{url: url}) );
    }

    else if(['mp3', 'ogg', 'wav', 'm4a'].includes(type)) {
	changemp3x(url+'?type=.mp3',name);
    }

    else if (['mp4', 'avi', 'mkv', 'webm', 'mov', 'flv', 'avi'].includes(type)) {
	changemp3x(url+'?type=.mp4',name);
    }

    else if (['rtf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'pps', 'ppt'].includes(type)) {
	url = url.replace(IPFS.endpoint, IPFS.endpoint_doc);
	url = "https://docs.google.com/gview?embedded=true&url="+encodeURIComponent(url);
	IPFS.viewer_iframe(name,url);
    }

    else if(type=='pdf') {
        // Браузер умеет PDF сам?
        if( window.navigator && window.navigator.pdfViewerEnabled ) IPFS.viewer_iframe(name,url);
	else {
	    url = "https://docs.google.com/gview?embedded=true&url="+encodeURIComponent(url);
	    IPFS.viewer_iframe(name,url);
	}
    }

    else if(type=='txt') {
        AJAX(url,function(o){
	    o = h(o);
	    o = obracom('\n'+o+'\n').trim();
	    o = o.replace(/\n/g,'<br>');
	    // ----------------

	    if(o.length > 4096) o="<div class='br'>"+o+"</div>";
	    IPFS.viewer(name, o);
	});
    }

    else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
	salert(h(name)+'<p>archive',1000);
    }


    else if(type=='pgp') {
	UPLOAD.View(url,name);
	// alert(`p: ${url} ${name}`);
    }

    else salert(h(name)+'<p>unknown type',1000);
},


// Веб-эксплорер файлов ipfs
List: function(opt) {
  return new Promise(function(resolve, reject) {
    AJ(IPFS.endpointLs,function(o){
	try {
	    var j=JSON.parse(o).Keys;
	    var o='',i=0;

	    var tmpl = opt?.template || "<tr>"
		+"<td>{i}</td>"
		+"<td><i alt='Delete' onclick='IPFS.Del(this)' class='e_cancel mv'></i></td>"
		+"<td><a class='r' onclick='return IPFS.View(this)' href='{#url}'>{#hash}</a></td>"
		+"<td><i class='e_help'></i></td>"
		+"<td class='r'></td>"
		+"<td class='r leng'></td>"
		+"<td>{type}</td>"
		+"<td class='br'><a href='{ipfsurl}' target='_blank'>ipfs.io</td>"
		+"</tr>";

	    for(var hash in j) {
		var type = j[hash].Type;

		if(opt?.type=='exist' && type != 'recursive') { delete(j[hash]); continue; }

		if(type == 'recursive') type=green(type); else type=red(type);
		o+=mpers(tmpl,{
		    i: ++i,
		    type:type,
		    hash:hash,
		    url:IPFS.endpoint+hash,
		    ipfsurl: "https://ipfs.io/ipfs/"+hash,
		});
	    }

	    o=mpers(
		opt?.table_template || "<table border='0' cellspacing='10' id='ipfs-list-table'>{table}</table>"
	    ,{table:o});
	    if(dom('ipfs-list')) dom('ipfs-list',o); else ohelpc('ipfs-list','IPFS files',o);

	    for(var hash in j) {
	        IPFS.Type(hash,function(hash,type,leng,name){
		    var tr=IPFS.find_tr(hash);
		    if(hash=='bafyb4iame7mlfhwxyd5vstfclifrnhzuzv22xkrysoghwg57yn3xe7u4sm')	    console.log(`tr
hash='${hash}'
type='${type}'
leng='${leng}'
name='${name}'
`,hash,type,leng,name,tr);
		    if(!tr) { console.log('!tr'); resolve('!tr'); return; }
		    // console.log('table',tr.closest('table').closest('div').id);
		    tr.setAttribute('content-type',type);
		    tr.querySelector('TD.r').innerHTML=h(type);
		    tr.querySelector('TD.leng').innerHTML=h(leng);
		    tr.querySelector('I.e_help').className=IPFS.typec(type);
		    if(name) tr.querySelector('TD.r').innerHTML=h(name);
		});
	    }

	    resolve('ok');
	} catch(er){
	    console.log('error: ',er);
	    reject('error: '+er);
	}
    },{quiet:true,stream:true,type:"recursive"});

  });
},


typec: function(type) {
    if(type=='text/plain') return 'e_kontact_journal';
    if(type=='text/html') return 'e_kontact_notes';
    var t=type.split('/')[0];
    if(t=='audio') return 'e_ljvideo';
    if(t=='video') return 'e_play-youtube';
    if(t=='image') return 'e_image';
    if(t=='document') return 'e_filenew';
    return 'e_ledpurple';
},


typece: function(type) {
    if(type=='text/plain') return '&#128220'; // 📜
    if(type=='text/html') return '&#127760;'; // 🌐
    var t=type.split('/')[0];
    if(t=='audio') return '&#127925;'; // 🎵
    if(t=='video') return '&#127909;'; // 🎥
    if(t=='image') return '&#128444;&#65039;'; // 🖼️
    if(t=='document') return '&#128196;'; // 📄
    return '&#10024;'; // ✨
},

save: function(s,opt){
    return new Promise(function(resolve, reject) {
	opt = opt || {};
	opt.type = opt.type || "text/plain";
	opt.name = opt.name || "comment.txt";
	ajaxon();
	var blob = new Blob([s], { type: opt.type });
	var formData = new FormData();
	formData.append("file", blob, opt.name);
	AJ(IPFS.endpointSave,function(o){
    	    ajaxoff();
	    try {
		var j=JSON.parse(o);
		if(j.Hash) resolve(j.Hash);
		else resolve(false);
	    } catch(e){ reject(''+e); }
	},formData);
    });
},

// Веб-запись новой итерации в блокчейн
Save: async function(s) {
    s=dom('ipfs_text').value;
    var hash=await IPFS.save(s);
    if(!hash) idie('Error hash!');
    var url=IPFS.endpoint+hash;
    var w=dom('new_ipfs'); if(w) dobavil(w,"<div><a target='_blank' href='"+url+"'>"+url+"</a>"
+"<div class='br'><b>"+IPFS.cid2hex(url)+"</b>"
+" &nbsp; <i onclick=\"if(confirm('Delete?'))IPFS.rm('"+url+"')\" class='e_cancel mv'></i>"
+"</div></div>");
    IPFS.List();
},


// Утилитка для изучения новых JS-библиотек
libtest: function(url) {
    alert('ok');
/*
   var OiShoBylo=[]; for(var i in window) OiShoBylo.push(i);
   LOADS_sync(url,function(){
    var OiShoStalo={}; Object.assign(OiShoStalo,window);
    for(var i of OiShoBylo) delete(OiShoStalo[i]);
    dier(OiShoStalo);
    });
*/
},

};


//==============================================================================

function text2html(o) {
    if (typeof o !== 'string') return '';
    o = o
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;') // '"
    ;
    o = obracom(o,{play:'lit'});
    o = o.replace(/\n/g, '<br>');
    // return h(o);
    return o;
}

obracom=function(o,set) {
    if(!o || !o.trim().length) return '';

  function hyperlink(s, k = 1) {
    const papki = "[a-zA-Z0-9!#$%()*+,\\-./:;=\\[\\]\\\\^_`{}|~]+";
    const lastaz = "[a-zA-Z0-9/]";
    const quer = "[a-zA-Z0-9!#$%&()*+,\\-./:;=?@\\[\\]\\\\^_`{}|~]+";
    const lastquer = "[a-zA-Z0-9#$&()/=@\\\\^_`}|~]";
    const pattern = new RegExp("([\\s>\\(:])" + // символы перед [1]
        "(" + // [2]
        "([a-z]+:\\/\\/|(www\\.))" + // http:// или www. [3]
        "([0-9a-zA-Z][A-Za-z0-9_.-]*[A-Za-z]{2,6})" + // aaa.bb-bb.c_c_c [4]
        "(\\:\\d{1,6}|)" + // порт или пустота [5]
        "(" +
        "\\/" + papki + lastaz + "\\?" + quer + lastquer + // /papka/papka.html?QUERY_STRING#HASH
        "|" + "\\?" + quer + lastquer + // ?QUERY_STRING#HASH
        "|" + "\\/" + papki + lastaz + // /papka/papka
        "|)" +
        ")" +
        "([\\.?\\:][^a-zA-Z0-9\\/]|[\\s" + (k ? "<>" : '') + ",\\)$])", "gs"); // символы после
    return s.replace(pattern, url_present);
  }

  function url_present(...p) {

    let httpsite = ''; // Пример: 'http://example.com', заменить на правильный домен
    let opt = {}; // Замените на актуальные параметры опций
    let media_id = ''; // Примерное значение, нужно будет заменить
    let site_mod = ''; // Примерное значение, нужно будет заменить

    let o = 1; // (!opt || opt['Comment_media'] === 'all' || opt['Comment_media'] === 'my' && explode_last('://', p[3] + p[5]) === explode_last('://', httpsite)) ? 1 : 0;

    let r = decodeURIComponent(p[7]);
    r = r.includes('.') ? r.split('.').pop().toLowerCase() : '';

    if(r === 'mp3') { // вставка mp3

        if(set&&set.play=='lit') return p[1] + `<play-media type="mp3" url="${h(p[2])}"></play-media>`+p[8];

        if(o) {
            return p[1] + MP3(p[2] + " | mp3") + p[8]; // Функция MP3 должна быть реализована отдельно
        } else {
            return url_click(p, 'mp3'); // Функция url_click должна быть реализована отдельно
        }
    }

    if(['www.youtube.com', 'youtu.be', 'm.youtube.com'].includes(p[5])) { // вставка роликов с ютуба
        let m = [];
        if (/youtube\.com\/clip\/([0-9a-z_-]+)/i.test(p[2])) {
            m[2] = 'clip/' + p[2].match(/youtube\.com\/clip\/([0-9a-z_-]+)/i)[1];
        } else {
            m = p[2].match(/(v=|youtu\.be\/)([0-9a-z_-]+)/i);
        }

        let t = 0;
        p[22] = p[2].replace('&amp;', '&');
        if (/[\?&]t=\d+h/i.test(p[22])) t += parseInt(p[22].match(/[\?&]t=\d+h/i)[0]) * 3600;
        if (/[\?&]t=\d+m/i.test(p[22])) t += parseInt(p[22].match(/[\?&]t=\d+m/i)[0]) * 60;
        if (/[\?&]t=\d+s/i.test(p[22])) t += parseInt(p[22].match(/[\?&]t=\d+s/i)[0]);

        t = t ? `?start=${t}` : '';

        if(o) {

	    if(set&&set.play=='lit') return `<play-media type="youtube" url="${h(m[2]+t)}" img="https://img.youtube.com/vi/${h(m[2])}/mqdefault.jpg"></play-media>`;

            return `<div alt='play'>${h(m[2] + t)} ` +
                `<div style='border: 1px solid #ccc;box-shadow: 0px 5px 5px 5px rgba(0,0,0,0.6);` +
                ` position:relative;width:320px;height:180px;display:inline-block;background-image:url(https://img.youtube.com/vi/${h(m[2])}/mqdefault.jpg);'>` +
                `<div style='display: inline-block; background-color: #fffbfb8a; position: absolute; top: 56px; left: 126px; font-size: 48px; padding: 0 20px 10px 20px; border-radius: 10px; color: #842222;' class='mv'>&#9654;</div>` +
                `</div>` +
                `</div>`;
        }
        return url_click(p, 'youtub', m[2]); // Функция url_click должна быть реализована отдельно
    }

    if (p[3] === 'www.') p[2] = 'http://' + p[2];
    let l = p[7];

    if(!l.includes('module=') && ['jpg', 'gif', 'jpeg', 'png', 'webp'].includes(r)) {
        if (o) {
            if (globalThis.HTTPS === 'https') {
                p[2] = p[2].replace(new RegExp(`http${httpsite.substr(5)}`, 'i'), '');
            }
            return `${p[1]}<img style="max-width:900px;max-height:800px" src="${p[2]}"${l.includes('&amp;prefix=normal') ? ' align=left hspace=10' : ''}>${p[8]}`;
        }
        return url_click(p, 'img'); // Функция url_click должна быть реализована отдельно
    }

    if (p[3] === 'area://') {
        return `${p[1]}<a target='_blank' href="http://fghi.pp.ru/?${p[2]}">${p[3] + p[5] + l}</a>${p[8]}`;
    }

    return `${p[1]}<noindex><a target='_blank' href="${p[2]}" rel="nofollow">${reduceurl(maybelink(p[3] + p[5] + l), 60)}</a></noindex>${p[8]}`;
}

    function reduceurl(s, l) {
	return s.length > l ? s.substr(0, l) + "[...]" : s;
    }

    // Примерная реализация функции explode_last, используемой в коде
    function explode_last(delimiter, string) {
	return string.split(delimiter).pop();
    }

    // Заглушки для функций MP3, url_click, maybelink и h, которые нужно реализовать отдельно
    function MP3(url) {
	return `<audio src="${url}" controls></audio>`;
    }

    function url_click(p, type, id) {
	return `<a target='_blank' href="${p[2]}">Click to view ${type}</a>`;
    }

    function maybelink(url) {
	return url;
    }

    function h(string) {
	return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    return hyperlink(o);

};