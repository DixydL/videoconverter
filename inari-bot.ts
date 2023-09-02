import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
//@ts-ignore
import input from "input";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { topics } from "./datas/topics";
import { sleep } from "./helper/function";
const fs = require("fs");

const systemGroup = "Флудильня";

async function createSystemTopics(client: any, sender: any) {
  for (const topic of topics) {
    const result = await client.invoke(
      new Api.channels.CreateForumTopic({
        channel: sender,
        title: topic.name,
        iconColor: topic.color,
      })
    );

    await sleep(500);

    //@ts-ignore
    console.log(result.updates[1].message);

    //@ts-ignore
    await client.sendMessage(result.updates[1].message.peerId, {
      //@ts-ignore
      replyTo: result.updates[1].message,
      message: topic.message,
    });
  }
}

async function test() {
  const apiId = 9392229;
  const apiHash = "d1d89e0ea5427607fb11848f2b0f798c";
  const stringSession = new StringSession("");

  (async () => {
    console.log("Loading interactive example...");
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });
    await client.start({
      phoneNumber: async () => await input.text("Please enter your number: "),
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () =>
        await input.text("Please enter the code you received: "),
      onError: (err: Error) => console.log(err),
    });

    console.log("You should now be connected.");
    console.log(client.session.save()); // Save this string to avoid logging in again

    async function eventPrint(event: NewMessageEvent) {
      const message: any = event.message;

      const media: any = event.message.media;

      // Checks if it's a private message (from user or bot)
      if (event.isGroup) {
        const resultTopics = (
          await client.invoke(
            new Api.channels.GetForumTopics({
              channel: message.peerId,
            })
          )
        ).topics.filter((topic: any) => topic.title != "General");

        if (resultTopics.find((topic: any) => topic.title == systemGroup)) {
          if (message.text.includes("@shadow_inari create project")) {
            const title = message.text.split("project")[1];
            console.log(title);

            const results = await client.invoke(
              new Api.channels.CreateChannel({
                forum: true,
                megagroup: true,
                title: title.trim(),
                about: title.trim(),
              })
            );

            console.log(message);
            //@ts-ignore
            createSystemTopics(client, results.chats[0]);

            await client.invoke(
              new Api.channels.InviteToChannel({
                //@ts-ignore
                channel: results.chats[0],
                users: [message.fromId],
              })
            );

            await client.invoke(
              new Api.channels.EditAdmin({
                //@ts-ignore
                channel: results.chats[0],
                userId: message.fromId,
                adminRights: new Api.ChatAdminRights({
                  changeInfo: true,
                  postMessages: true,
                  editMessages: true,
                  deleteMessages: true,
                  banUsers: true,
                  inviteUsers: true,
                  pinMessages: true,
                  addAdmins: true,
                }),
                rank: "admin",
              })
            );
          }

          return;
        }

        if (message.text === "@shadow_inari deletes template topics") {
        }

        if (message.text === "@shadow_inari deletes template topics") {
          await sleep(500);

          for (const messageTopic of resultTopics) {
            try {
              // const result = await client.invoke(
              //   new Api.channels.DeleteTopicHistory({
              //     channel: message.peerId,
              //     //@ts-ignore
              //     topMsgId: messageTopic.id as MessageIDLike,
              //   })
              // );
            } catch (e) {}
          }
        }
      }
    }

    client.addEventHandler(
      eventPrint,
      new NewMessage({
        fromUsers: ["@shadow_inari", "@JO_ER", "@Tera47"],
      })
    );
  })();
}

test();
