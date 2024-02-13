import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();

import pkg from 'discord.js';
const { Client, IntentsBitField, AttachmentBuilder } = pkg;
import {processPostRequest} from "./scrapeProfileData.js";

// Create a readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
// Function to ask for user input
function askQuestion(query) {
return new Promise(resolve => {
    rl.question(query, resolve);
});
}


// Function to check environment variables and ask for auth method
async function checkEnvAndChooseAuth() {
    const cookie = process.env.COOKIE;
    const liUser = process.env.LI_USER;
    const liPass = process.env.LI_PASS;
  
    if (!cookie && (!liUser || !liPass)) {
      console.error('Error: COOKIE or LI_USER with LI_PASS must be set in .env file.');
      process.exit(1);
    }
  
    let authMethod = 'cookie'; // default to cookie
    if (cookie && liUser && liPass) {
      const answer = await askQuestion('Choose authentication method:\n1. Use cookie\n2. Use login auth\nEnter 1 or 2: ');
      if (answer === '2') {
        authMethod = 'login';
      }
    }
  
    // Set the global variable
    global.authMethod = authMethod;

    console.log('metodo de auth elegido: ', global.authMethod);
  
    // Close the readline interface
    rl.close();
  }
  
  // Call the function before initializing the client
  await checkEnvAndChooseAuth();

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
})

client.on('ready', (c) => {
    console.log(`✅ ${c.user.tag} is online `)
})

// client.on('messageCreate', (message) => {
//     console.log(message.content)
//     if (message.author.bot) return
//     if (message.content === 'Hola' || message.content === 'hola') {
//         message.reply('Hola!!')
//     }
// })

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
  
    if (interaction.commandName === 'ping') {
      await interaction.reply('Pong!');
    }
    
    if (interaction.commandName === 'perfil') {
        const url = interaction.options.get('url').value;

        await interaction.deferReply();
    //    await  interaction.reply("procesando...")

        console.log("url enviada por el usuario: ", url)

        const res = await processPostRequest(url);

        console.log("datos obtenidos: ", res);
      
        const resString = JSON.stringify(res, null, 2);
        if (resString.length <= 2000) {
        await interaction.editReply(resString);
        } else {
        const buffer = Buffer.from(resString, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {name: 'profile.json'});
        await interaction.editReply({ content: 'The response is too large to display here. Please see the file.', files: [attachment] });
        }
    }

  });

  
client.login(process.env.TOKEN)