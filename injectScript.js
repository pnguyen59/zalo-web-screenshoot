
// const t = setInterval()
function foo(mutationlist){
	console.log(mutationlist.length);
	for(var i =0; i<mutationlist.length ; i++){
		if(mutationlist[i].target.id =='chatView'){
			 var x = mutationlist[i].target.querySelector(".btn.fa.fa-capture-zalo.capture-icon ");
			 console.dir(x);
			 x.addEventListener('click',function(){
		 		chrome.runtime.sendMessage({greeting: 'hello'},function(response){
		 		console.log(response.farewell);
		 		})
		 	 })
			 break;
		}
	}
}




var observer = new MutationObserver(foo);

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true
})