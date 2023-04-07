const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const mongoose = require('mongoose');
const passwordMongoAtlas = process.env['passwordMongoAtlas']

mongoose.connect(`mongodb+srv://talent:${passwordMongoAtlas}@communitationbot.hrgbsg0.mongodb.net/communitation_bot?retryWrites=true&w=majority`);

let schema = new mongoose.Schema({
    name: String,
    chatId: Number
});

let chats = mongoose.model('chats', schema)

const token = process.env['token'];
const bot = new Telegraf(token);

bot.start((ctx) => {
    ctx.replyWithHTML(`<b>Всем привет!</b> \nЯ бот коммуникатор, моя задача облегчить общение людей из разных чатов. \n\nЧтобы я мог работать, необходимо: Зарегистрировать свой чат, командой: \n/register [публичное название вашего чата]\n\nДля отправки сообщений в другой чат, напишите команду: \n/send [название чата] [сообщение]\n\nДля изменение публичного названия вашего чата введите: \n/chatrename [новое название чата]`);
});

bot.command('register', async (ctx) => {
  let chatName = ctx.message.text.replace('/register', '').trim();
  if(!chatName){ 
    ctx.reply("Вы не ввели публичное название вашего чата.");
    return; 
  }

  let nowChatId = ctx.message.chat.id;
  let chatIsRegister = await chats.findOne({chatId: nowChatId});
  if(chatIsRegister != null){
    ctx.reply("Вы уже зарегистрировали этот чат");
    return;
  }
  
  let newChat = new chats({ name: chatName, chatId: ctx.message.chat.id});
  newChat.save();
  ctx.reply(`Чат ${chatName} успешно зарегистрирован.`);
});

bot.command('/chatrename', async (ctx) => {
  let newChatName = ctx.message.text.replace('/chatrename', '').trim();
  if(!newChatName){ 
    ctx.reply("Вы не ввели публичное название вашего чата.");
    return; 
  }

  let nowChatId = ctx.message.chat.id;
  let chatIsRegister = await chats.findOne({chatId: nowChatId});
  if(chatIsRegister == null){
    ctx.reply("Вы не регистрировали этот чат");
    return;
  }
});

bot.command('send', async (ctx) => {
  let nowChatId = ctx.message.chat.id;
  let chatIsRegister = await chats.findOne({chatId: nowChatId});
  if(chatIsRegister == null){
      ctx.replyWithHTML(`Ваш чат не зарегистрирован!\nДля регистрации напишите: /register [название чата]`);
    return;
  }

  let text = ctx.message.text.replace('/send', '').split(' ');
  let chatName = text[1];
  let chat = await chats.findOne({name: chatName});

  if(chat == null){
    ctx.reply("Указанный вами чат не существует, либо он не зарегистрирован.");
    return;
  } 
  if(!text[2]){
    ctx.reply("Укажите сообщение, которое хотите отправить");
    return;
  }
  
  let chatId = chat.chatId;
  let chatMessage = text[2];

  for(let i = 3; i < text.length; i++){
    chatMessage += ` ${text[i]}`;
  };

  bot.telegram.sendMessage(chatId, chatMessage);
  ctx.reply(`Сообщение успешно отправлено в чат: ${chat.name}`);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

require('./server')();
