parseUrl();

function parseUrl() {
  var searchParam = new URL(location).searchParams.get('search');
  
  var input = document.getElementsByClassName("header_searchbox")[0];
  input.value = searchParam;
}

loadBots();

function loadBots() {
  var data = loadText("https://raw.githubusercontent.com/loldiscordbots/loldiscordbots.github.io/main/bots.txt").then(function(data){
    var lines = data.split('\n');
	
	var container = document.getElementsByClassName("champion_container")[0];
	var template = document.getElementsByClassName("champion_card")[0];
	
	for(var i=0; i<lines.length; i++) {
	  var line = lines[i];
	  var attributes = line.split('|');
	  
	  if(attributes.length > 1) loadBot(attributes, container, template);
	}
	
	addClickEvents();
	
	var searchParam = new URL(location).searchParams.get('search');
	
	var input = document.getElementsByClassName("header_searchbox")[0];
	search(input);
  });
}

function loadBot(attributes, container, template) {
  var name = attributes[0];
  var icon = "url(\"imgs/icons/champions/"+name.toLowerCase().replaceAll(" ", "_")+".png\")";
  var id = attributes[1];
  var description = attributes[2];
  
  var card = template.cloneNode(true);
  card.style = "";
  
  card.querySelector('div[class="champion_card_text"]').innerText = name;
  card.querySelector('div[class="champion_card_icon"]').style.backgroundImage = icon;
  card.querySelector('div[class="champion_card_description"]').innerText = description;
  card.querySelector('div[class="champion_card_id"]').innerText = id;
  
  container.appendChild(card); 
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
  var query = e.value;
  
  const url = new URL(location);
  if(query.length != 0) url.searchParams.set('search', query);
  else url.searchParams.delete('search');
  history.replaceState(null, null, url);
  
  query = query.toLowerCase();
  
  var cards = document.getElementsByClassName("champion_card");
  for(var i = 0; i < cards.length; i++) {
	var card = cards.item(i);
	
	toggleVisibility(card, query);
  }
}

function toggleVisibility(card, query) {
  var name = card.querySelector('div[class="champion_card_text"]').innerText.toLowerCase();
  if(name.length == 0) return;
  
  if(query.length == 0 || name.includes(query)) card.style = "";
  else card.style = "display: none;";
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