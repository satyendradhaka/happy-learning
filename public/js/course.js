$(document).ready(function(){
	let total=0;
	let lessons=0;
	$('#vid-wrapper>div').each(function(){
		let span=$(this).children("span").eq(1)
		let t=parseInt(span.text())
		span.text(getFormattedTime(t))
		total+=t
		lessons+=1
	})
	$('#vid-header>span:last-child').text(getFormattedTime(total))
	$('#vid-header>span:nth-of-type(2)').text(`${lessons} Lessons`)
})

function getFormattedTime(t){
	if(t<60){
			return `${t} sec`
		}
		let mins=Math.floor(t/60)
		if(mins<60){
			let secs=t-mins*60
			return `${mins}:${(secs<10)?`0${secs}`:secs} min`
		}
		let hrs=Math.floor(mins/60)
		mins-=hrs*60
		return `${hrs}:${(mins<10)?`0${mins}`:mins} hr`
}