parseUrl();

function parseUrl() {
  var searchParam = new URL(location).searchParams.get('search');
  var sortParam = new URL(location).searchParams.get('sort_type');
  
  var searchInput = document.getElementsByClassName("header_searchbox")[0];
  searchInput.value = searchParam;
  
  selectSortType(sortParam == null || sortParam === "undefined" || sortParam.length == 0 ? 0 : parseInt(sortParam));
}

window.addEventListener('resize', function(event) {
  setTitleWidths();
}, true);

window.addEventListener('click', function(click){
  var e = document.getElementsByClassName("header_sortselect")[0];
  
  if(!e.contains(click.target)){
    closeSortMenu(e);
  }
});

function removePreloading() {
  var e = document.getElementById("preloading");
  
  setVisibility(e, false);
  
  document.body.style.removeProperty("overflow");
}

var list;

var query;
var sortType;

var currentList;
var loadedTo = 0;

loadList();

function loadList() {
  loadText("https://raw.githubusercontent.com/ogfinder/ogfinder.github.io/main/names.txt").then(function(data){
    loadText("https://raw.githubusercontent.com/ogfinder/ogfinder.github.io/main/blocked_names.txt").then(function(data2){
	  loadText("https://raw.githubusercontent.com/ogfinder/ogfinder.github.io/main/emojis.txt").then(function(data3){
		
		loadEmojis(data3);
		
	    var blockedNames = data2.split('\n');
	    
        var lines = data.split('\n');
	    
	    list = [];
	    
	    for(var line of lines) {
	      var split = line.split(" ");
	      
	      list.push({
		    name: split[0],
		    popularity: parseFloat(split[1]),
		    og: false,
		    status: blockedNames.includes(split[0]) ? 3 : split[2] === "null" ? (isAvailableNow(parseInt(split[3])) ? 0 : 1) : 2
          });
	    }
	    
	    updateStats();
	    
	    var searchInput = document.getElementsByClassName("header_searchbox")[0];
	    search(searchInput);
	    
	    removePreloading();
	  });
    });
  });
}

function isAvailableNow(time) {
  return Date.now() - time >= 3196800000;
}

function updateStats() {
  var displays = document.getElementsByClassName("stat_number");
  
  var availableCount = list.filter((e) => e.status == 0).length;
  var availableSoonCount = list.filter((e) => e.status == 1).length;
  
  displays[0].innerText = formatNumber(availableCount);
  displays[1].innerText = formatNumber(availableSoonCount);
}

function formatNumber(x) {
  x = roundifyNumber(x);
  
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function roundifyNumber(x) {
  if(x < 1000) return x;
  
  var n = 3;
  var l = Math.ceil(Math.log10(x + 1));
  var d = Math.pow(10, l - n);
  
  return Math.round(x / d) * d;
}

function updateCurrentList() {
  clearEntryList();
  
  currentList = [];
  
  for(var e of list) {
	if(matches(e)) currentList.push(e);
  }
  
  currentList.sort(function(e1, e2) { 
    return compare(e1, e2);
  });
  
  loadedTo = 0;
  
  showNothingFound(currentList.length == 0);
  
  loadEntries(175);
}

function showNothingFound(b) {
  var e = document.getElementsByClassName("nothing_found_text")[0];
  
  setVisibility(e, b);
}

function hideTitles() {
  var list = document.getElementsByClassName("list_title");
  
  for(var e of list) {
	setVisibility(e, false);
  }
}

function showTitle(i, container) {
  var e = document.getElementsByClassName("list_title")[i];
  
  setVisibility(e, true);
}

function setTitleWidths() {
  var cardWidth = 200 + 8 * 2;
  
  var containers = document.getElementsByClassName("list_container");
  
  var maxWidth = 0;
  var maxCount = 0;
  
  for(var container of containers) {
	maxWidth = Math.max(container.offsetWidth, maxWidth);
	maxCount = Math.max(container.childElementCount, maxCount);
  }
  
  var lineWidth = cardWidth * maxCount;
  
  if(lineWidth > maxWidth * 3) {
	lineWidth = Math.floor(maxWidth / cardWidth) * cardWidth - 8 * 2;
  } else {
    lineWidth = 0;
  }
  
  var titles = document.getElementsByClassName("list_title");
  
  for(var e of titles) {
	if(lineWidth == 0) e.style.removeProperty("width");
	else e.style.width = lineWidth + "px";
  }
}

function setVisibility(e, b) {
  if(b) e.style.removeProperty("display");
  else e.style.display = "none";
}

function isVisible(e) {
  return e.style.display != "none";
}

function matches(e) {
  return query == null || e.name.includes(query);
}

function compare(e1, e2) {
  var i = e1.status - e2.status;
  
  if(i != 0) return i;
  
  if(query != null && query.length != 0) {
	i = e1.name.indexOf(query) - e2.name.indexOf(query);
	
	if(i != 0) return i;
	
	var diff1 = e1.name.length - query.length;
	var diff2 = e2.name.length - query.length;
	
	i = diff1 - diff2;
	
	if(i != 0) return i;
  }
  
  if(sortType == 1) {
    return e2.popularity - e1.popularity;
  } else {
	if(e1.name < e2.name) return -1;
    if(e1.name > e2.name) return 1;
    return 0;
  }
}

function loadEntries(amount) {
  if(currentList == null || loadedTo >= currentList.length) return;
  
  var template = document.getElementsByClassName("entry_card")[0];
  
  for(var i = loadedTo; i < loadedTo + amount; i++) {
	if(i >= currentList.length) break;
	
    var e = currentList[i];
	
	addEntry(e, template);
  }
  
  loadedTo += amount;
  
  setTitleWidths();
}

window.onscroll = function(ev) {
  if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
    loadEntries(175);
  }
};

function addEntry(e, template) {
  var index = e.status;
  
  var container = document.getElementsByClassName("list_container")[index];
  
  setVisibility(container, true);
  
  var card = template.cloneNode(true);
  
  card.style = "";
  
  card.querySelector('div[class="entry_card_text"]').innerText = e.name;
  
  var tags = card.querySelectorAll('div[class="entry_card_tag"]');
  
  toggleTagVisibility(tags.item(e.status));
  if(e.og) toggleTagVisibility(tags.item(3));
  
  card.addEventListener('click', event => {
    copyToClipboard(e.name);
	
	showCopiedSign(card);
  });
  
  addEmoji(card, e);
  
  container.appendChild(card);
  
  showTitle(index, container);
}

function toggleTagVisibility(tag) {
  setVisibility(tag, true);
}

function copyToClipboard(s) {
  var tempInput = document.createElement("input");
  tempInput.value = s;
  
  document.body.appendChild(tempInput);
  tempInput.select();
  
  document.execCommand("copy");
  
  document.body.removeChild(tempInput);
}

function showCopiedSign(card) {
  var e = card.querySelector(".copied_sign");
  
  if(e.style.opacity != "0") return false;
  
  e.style.opacity = "1";
  
  setTimeout(() => e.style.opacity = "0", 1000);
}

function search(e) {
  query = e.value;
  
  const url = new URL(location);
  
  if(query.length != 0) url.searchParams.set('search', query);
  else url.searchParams.delete('search');
  
  history.replaceState(null, null, url);
  
  query = query.toLowerCase().replace(" ", "");
  
  updateCurrentList();
}

function sort(type) {
  if(sortType == type) return;
  
  sortType = type;
  
  const url = new URL(location);
  
  if(sortType != 0) url.searchParams.set('sort_type', sortType);
  else url.searchParams.delete('sort_type');
  
  history.replaceState(null, null, url);
  
  updateCurrentList();
}

function clearEntryList() {
  var containers = document.getElementsByClassName("list_container");
  
  for(var container of containers) {
	container.innerHTML = "";
	
	setVisibility(container, false);
  }
  
  hideTitles();
}

function onSortMenuClick(e) {
  if(e.classList.contains("open")) {
	closeSortMenu(e);
  } else {
	openSortMenu(e);
  }
}

function openSortMenu(e) {
  e.classList.add("open");
  
  var options = e.querySelector(".header_sortselect_options");
  
  setVisibility(options, true);
}

function closeSortMenu(e) {
  e.classList.remove("open");
  
  var options = e.querySelector(".header_sortselect_options");
  
  setVisibility(options, false);
}

function selectSortType(type) {
  var e = document.getElementsByClassName("header_sortselect")[0];
  
  var options = e.querySelector(".header_sortselect_options");
  
  selectSortElement(options.children[type], type, false);
}

function selectSortElement(e, type, update) {
  var span = document.getElementsByClassName("header_sortselect")[0].children[0];
  
  span.innerText = e.innerText;
  
  e.classList.add("selected");
  
  var menu = document.getElementsByClassName("header_sortselect")[0];
  
  var options = menu.querySelector(".header_sortselect_options");
  
  for(var option of options.children) {
	if(option != e) option.classList.remove("selected");
  }
  
  if(update) sort(type);
  else sortType = type;
}

const emojis = [];

function loadEmojis(data) {
  var lines = data.split('\n');
  
  for(var line of lines) {
	var split = line.split(",");
	
	emojis.push({
	  code: split[0],
	  keywords: split.slice(1, split.length)
	});
  }
}

function addEmoji(card, e) {
  if(e.popularity < 3.75 / 10000000) return;
  
  var url = null;
  
  var m = 100;
  
  for(var emoji of emojis) {
	
	var k = emoji.keywords.length - 1;
	
	var i = 0;
	
	for(var keyword of emoji.keywords) {
	  
      var score = k + i * 3;
	  
	  if(i > 2 || score > m) break;
	  
	  if(keyword == e.name) {
		url = emoji.code;
		
		m = score;
		
	    break;
	  }
	  
	  i++;
	}
  }
  
  if(url != null) setEmoji(card, url);
}

function setEmoji(card, url) {
  var image = document.createElement("img");
  
  var emoji = "";
  
  var split = url.split("-");
  
  for(var s of split) {
	var utf16 = toUTF16Pair("0x" + s).split(" ");
	
    emoji += String.fromCharCode(parseInt("0x" + utf16[0]), parseInt("0x" + utf16[1]));
  }
  
  image.src = "https://raw.githubusercontent.com/ogfinder/ogfinder.github.io/main/imgs/emojis/" + url + ".svg";
  image.alt = emoji;
  
  image.style.maxWidth = "19px";
  image.style.maxHeight = "19px";
  
  image.style.display = "flex";
  image.style.alignItems = "center";
  
  image.style.marginRight = "9px";
  card.children[0].style.marginRight = "6px";
  
  image.style.pointerEvents = "none";
  
  card.insertBefore(image, card.children[1]);
}

function autoCropSVG(svg) {
  var bbox = svg.getBBox();
  
  var viewBox = [bbox.x, bbox.y, bbox.width, bbox.height].join(" ");
  
  svg.setAttribute("viewBox", viewBox);
}

function toUTF16Pair(x) {
  return ((((x - 0x10000) >> 0x0a) | 0x0) + 0xD800).toString(16) + ' ' + (((x - 0x10000) & 0x3FF) + 0xDC00).toString(16);
}

function loadText(url) {
    return new Promise(
        function(resolve, reject) {
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.send(null);

            request.onreadystatechange = function() {
                if (request.readyState === 4 && request.status === 200) {
                    var type = request.getResponseHeader('Content-Type');
                    if (type.indexOf("text") !== 1) {
                        resolve(request.responseText);
                    }
                }
            }
        });
}