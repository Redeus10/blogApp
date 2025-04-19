try{
    const passwordField = document.getElementById("password");
    const warningText = document.getElementById("warning");
    let timeout;
    
    passwordField.addEventListener("input",event => {
        const password = event.target.value;
        clearTimeout(timeout)
        timeout=setTimeout(()=>{
            if (password.length <= 4) {
                warningText.textContent = "The password length should be more than 4 characters.";
            } else {
                warningText.textContent = "";
            }
        },700)
      
    });
}
catch(err){
    console.log(err)
}

function openModal() {
    document.getElementById("postModal").style.display = "flex";
    document.body.style.position="fixed";
    document.body.style.width="100vw";
   
    
}


function closeModal() {
    document.getElementById("postModal").style.display = "none";
    document.body.style.position="";
    document.body.style.width="";
    

}
try{
    const back=document.getElementById("postModal");

console.log(back)
back.addEventListener("click",(event)=>{
    console.log(event.target)
    if (event.target === back) {
        back.style.display="none"
       
}
})
}
catch(err){
    console.log(err);
}

AOS.init();


const lenis = new Lenis({
  smooth: true,       
  lerp: 0.05,       
  wheelMultiplier: 0.4, 
  infinite: false     
});


function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf); 
}


requestAnimationFrame(raf);
function openMenu() {
    const blockMenu = document.getElementById("block_menu");
    const imgBtn = document.getElementById("imgBtn");
    const menuDrop = document.getElementById("menu_drop");

    blockMenu.style.display = "flex";
    imgBtn.style.width = "50px";
    imgBtn.setAttribute("src", "/menu_btn_close.svg");
    document.body.style.position = 'fixed'; 
    document.body.style.overflow="hidden";
    

    Object.assign(menuDrop.style, {
        position: "fixed",
        top: "30px",
        right: "0"
    });

    menuDrop.setAttribute("onclick", "closeMenu()");
}

function closeMenu() {
    const blockMenu = document.getElementById("block_menu");
    const imgBtn = document.getElementById("imgBtn");
    const menuDrop = document.getElementById("menu_drop");

    blockMenu.style.display = "none";
    imgBtn.style.width = "23px";
    imgBtn.setAttribute("src", "/menu_btn_new.svg");

    menuDrop.style.position = "static";
    document.body.style.position = 'static'; 
    document.body.style.overflow="auto"; 
    menuDrop.setAttribute("onclick", "openMenu()");
}
