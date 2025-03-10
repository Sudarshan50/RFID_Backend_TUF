const strategy  = (t)=>{
    if(t<=30)
    {
        return 30;
    }else if(t %60 <30 && t>30)
    {
        return Math.floor(t/60)*60;
    }else{
        return Math.floor(t/60)*60+30;
    }
}
export default strategy;