parseUrl();

function parseUrl() {
  var searchParam = new URL(location).searchParams.get('search');
  
  var input = document.getElementsByClassName("header_searchbox")[0];
  input.value = searchParam;
}

var list;

var query;

var currentList;
var loadedTo = 0;

loadList();

function loadList() {
  var data = loadText("https://raw.githubusercontent.com/ogfinder/ogfinder.github.io/main/names.txt").then(function(data){
    lines = data.split('\n');
	
	list = [];
	
	for(var line of lines) {
	  var split = line.split(" ");
	  
	  list.push({
		name: split[0],
		og: false,
		status: 0
      });
	}
	
	updateStats();
	
	var input = document.getElementsByClassName("header_searchbox")[0];
	search(input);
  });
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
  
  loadEntries(200);
}

function matches(e) {
  if(query != null && !e.name.includes(query)) return false;
  
  return true;
}

function compare(e1, e2) {
  if(query != null) {
	var i = e1.name.indexOf(query) - e2.name.indexOf(query);
	
	if(i != 0) return i;
	
	var diff1 = e1.name.length - query.length;
	var diff2 = e2.name.length - query.length;
	
	i = diff1 - diff2;
	
	if(i != 0) return i;
  }
  
  var i = e1.status - e2.status;
  
  if(i != 0) return i;
  
  if(e1.name < e2.name) return -1;
  if(e1.name > e2.name) return 1;
  return 0;
}

function loadEntries(amount) {
  if(currentList == null || loadedTo >= currentList.length) return;
  
  var container = document.getElementsByClassName("list_container")[0];
  var template = document.getElementsByClassName("entry_card")[0];
  
  for(var i = loadedTo; i < loadedTo + amount; i++) {
	if(i >= currentList.length) break;
	
    var e = currentList[i];
	
	addEntry(e, container, template);
  }
  
  loadedTo += amount;
}

window.onscroll = function(ev) {
  if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
    loadEntries(200);
  }
};

function addEntry(e, container, template) {
  var card = template.cloneNode(true);
  
  card.style = "";
  
  card.querySelector('div[class="entry_card_text"]').innerText = e.name;
  
  var tags = card.querySelectorAll('div[class="entry_card_tag"]');
  
  if(e.status == 0) toggleTagVisibility(tags.item(0));
  else if(e.status == 1) toggleTagVisibility(tags.item(1));
  else if(e.status == 2) toggleTagVisibility(tags.item(2));
  if(e.og) toggleTagVisibility(tags.item(3));
  
  container.appendChild(card); 
}

function toggleTagVisibility(tag) {
  tag.style.removeProperty("display");
}

function addClickEvents() {
  var container = document.getElementById("profile_container");
  container.onclick = function(e) {
	if (e.target !== this) return;
	
	closeProfile(container);
  };
  
  var cards = document.getElementsByClassName("champion_card");
  for(var i = 0; i < cards.length; i++) {
	var card = cards.item(i);
	
    card.onclick = function(e) {
	  var child = e.target;
	  while(!child.classList.contains('champion_card')) {
		child = child.parentElement;
	  }
	  
	  openProfile(child);
	};
  }
}

function search(e) {
  query = e.value;
  
  const url = new URL(location);
  
  if(query.length != 0) url.searchParams.set('search', query);
  else url.searchParams.delete('search');
  
  history.replaceState(null, null, url);
  
  query = query.toLowerCase();
  
  updateCurrentList();
}

function clearEntryList() {
  var container = document.getElementsByClassName("list_container")[0];
  
  while(container.childElementCount > 1) {
	container.removeChild(container.lastChild);
  }
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