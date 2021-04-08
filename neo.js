JAVASCRIPT
var token = "ExponentPushToken[tgg0E4EE-Y1BBTOANdx103]";

const sendPushNotification=(token,title,body)=>{
	var url = "https://exp.host/--/api/v2/push/send";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function () {
	   if (xhr.readyState === 4) {
	      console.log(xhr.status);
	      console.log(xhr.responseText);
	   }
	};
	var data = `{
  "to": token,
  "title":"hello",
  "body": "world"
}`;
	xhr.send(data);
}

CURL 

curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": token,
  "title":"hello",
  "body": "world"
}'

