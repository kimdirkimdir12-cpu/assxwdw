const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json({limit:'2mb'}));
app.use(express.static(path.join(__dirname,'public')));

const token = '8331628985:AAEcxjLxU3bb6BfbLFQJw1G5NTcYNn6JlaU';     // 🔑 o‘zingizning bot tokeningiz
const chatId = '5728779626';      // 👤 o‘zingizning chat ID
let lastUpdateId=0;

// 📌 HTML faylni Telegramga yuborish
app.post('/upload-html',async(req,res)=>{
  const html=req.body.html;
  if(!html) return res.status(400).json({success:false,error:'Bo‘sh HTML'});
  const filePath=path.join(__dirname,'page.html');
  fs.writeFileSync(filePath,html);

  const form=new FormData();
  form.append('chat_id',chatId);
  form.append('document',fs.createReadStream(filePath),'page.html');

  try{
    const tgRes=await axios.post(`https://api.telegram.org/bot${token}/sendDocument`,form,{headers:form.getHeaders()});
    lastUpdateId= tgRes.data.update_id || lastUpdateId;
    res.json({success:true,since:lastUpdateId});
  }catch(err){
    console.error('❌ Telegramga yuborishda xatolik:',err.message);
    res.status(500).json({success:false});
  }
});

// 📌 So‘nggi xabarni olish
app.get('/latest',async(req,res)=>{
  const since=parseInt(req.query.since||0,10);
  try{
    const {data}=await axios.get(`https://api.telegram.org/bot${token}/getUpdates?offset=${since+1}`);
    if(data.ok && data.result.length>0){
      let msg=null;
      data.result.forEach(u=>{
        if(u.message && u.message.text){
          lastUpdateId=u.update_id;
          msg=u.message.text;
        }
      });
      return res.json({success:true,message:msg,update_id:lastUpdateId});
    }
    res.json({success:false});
  }catch(err){
    console.error('❌ Xabar olishda xatolik:',err.message);
    res.status(500).json({success:false});
  }
});

// 🚀 Serverni ishga tushirish
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`✅ Server http://localhost:${PORT} da ishlayapti`));
