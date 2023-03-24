const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/communitation_bot');

let schema = new mongoose.Schema({
    name: String,
    chatId: Number
});

let chats = mongoose.model('chats', schema);

const bot = new Telegraf(token);
bot.start((ctx) => {
    ctx.replyWithHTML(`<b>Всем привет!</b> \nЯ бот коммуникатор, моя задача облегчить общение людей из разных чатов. \n\nЧтобы я мог работать, необходимо: Зарегистрировать свой чат, командой: \n/register [публичное название вашего чата]\n\nДля отправки сообщений в другой чат, напишите команду: \n/send [название чата] [сообщение]`);
});

bot.command('register', async (ctx) => {
    let chatName = ctx.message.text.replace('/register', '').trim();
    if(!chatName){ 
        ctx.reply("Вы не ввели публичное название вашего чата.");
    } else {
        let newChat = new chats({ name: chatName, chatId: ctx.message.chat.id});
        newChat.save();
        ctx.reply(`Чат ${chatName} успешно зарегистрирован.`);
    }
});

bot.command('send', async (ctx) => {
    let nowChatId = ctx.message.chat.id;
    let chatIsRegister = await chats.findOne({chatId: nowChatId});

    if(chatIsRegister == null){
        ctx.replyWithHTML(`Ваш чат не зарегистрирован!\nДля регистрации напишите: /register [название чата]`)
    } else{
        let text = ctx.message.text.replace('/send', '').split(' ');
        let chatName = text[1];
        let chat = await chats.findOne({name: chatName});

        if(chat == null){
            ctx.reply("Указанный вами чат не существует, либо он не зарегистрирован.");
        } else if(!text[2]){
            ctx.reply("Укажите сообщение, которое хотите отправить");
        } else {
            let chatId = chat.chatId;
            let chatMessage = text[2];

            for(let i = 3; i < text.length; i++){
                chatMessage += ` ${text[i]}`;
            };

            bot.telegram.sendMessage(chatId, chatMessage);
            ctx.reply(`Сообщение успешно отправлено в чат: ${chat.name}`);
        }
    }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));