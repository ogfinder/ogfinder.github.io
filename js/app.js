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
		og: split.length > 1 && split[1] === "(og)",
		status: 1
      });
	}
	
	var input = document.getElementsByClassName("header_searchbox")[0];
	search(input);
  });
}

function updateCurrentList() {
  clearEntryList();
  
  currentList = [];
  
  for(var e of list) {
	if(matches(e)) currentList.push(e);
  }
  
  loadedTo = 0;
  
  loadEntries(200);
}

function matches(e) {
  if(query != null && !e.name.includes(query)) return false;
  
  return true;
}

function loadEntries(amount) {
  if(loadedTo >= currentList.length) return;
  
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

function openProfile(card) {
  var name = card.querySelector('div[class="champion_card_text"]').innerText;
  var icon = card.querySelector('div[class="champion_card_icon"]').style.backgroundImage;
  var description = card.querySelector('div[class="champion_card_description"]').innerText;
  var id = card.querySelector('div[class="champion_card_id"]').innerText;
  
  var container = document.getElementById("profile_container");
  
  container.querySelector('span[class="profile_name"]').innerText = name;
  container.querySelector('div[class="profile_icon"]').style.backgroundImage = icon;
  container.querySelector('div[class="profile_content"]').innerText = description;
  container.querySelector('a[class="invite_button"]').href = "https://discord.com/oauth2/authorize?client_id="+id+"&scope=bot";
  
  container.style.display = "flex";
}

function closeProfile(container) {
  container.style.display = "none";
}

function search(e) {
  query = e.value.toLowerCase();
  
  const url = new URL(location);
  
  if(query.length != 0) url.searchParams.set('search', query);
  else url.searchParams.delete('search');
  
  history.replaceState(null, null, url);
  
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