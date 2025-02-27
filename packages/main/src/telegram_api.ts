import BotApi from "./bot_api";
import {
    Commands,
    TelegramInlineQueryResult,
    TelegramUpdate,
    Webhook,
    Update,
  } from "./types";
import { addSearchParams, log, responseToJSON } from "./libs";
import Handler from "./handler";

export default class TelegramApi extends BotApi {
  constructor(commands: Commands, webhook: Webhook, handler: Handler) {
    super(commands, webhook, handler);
  }

  inlineQueryUpdate = async (update: TelegramUpdate): Promise<Response> =>
    this.executeInlineCommand(update).then(
      async (response) => await responseToJSON(response) && response
    );

  messageUpdate = async (update: TelegramUpdate): Promise<Response> => {
    if (typeof (update.message?.text ?? false) === 'string') {
      return await this.executeCommand(update).then(
        async () => await this.greetUsers(update)
      )
    }
    return this.updates.default();
  }

  updates = {
    inline_query: this.inlineQueryUpdate,
    message: this.messageUpdate,
    default: (_?: TelegramUpdate) => new Response(),
  };

  update = async (update: Update): Promise<Response> =>
    (log({ update }) &&
      update.message !== undefined &&
      (await this.updates.message(update as TelegramUpdate))) ||
    (update.inline_query !== undefined &&
      (await this.updates.inline_query(update as TelegramUpdate))) ||
    this.updates.default;

  // greet new users who join
  greetUsers = async (update: TelegramUpdate): Promise<Response> => {
    if (update.message?.new_chat_members !== undefined) {
      return this.sendMessage(
        update.message.chat.id,
        `Welcome to ${update.message.chat.title}, ${update.message.from.username}`
      );
    }
    return this.updates.default();
  }

  getCommand = (args: string[]): string => args[0]?.split("@")[0];

  // run command passed from executeCommand
  _executeCommand = async (
    update: TelegramUpdate,
    text: string,
    args: string[] = []
  ) =>
    (log({ execute: { text, args } }) &&
      (async (text_args: string[]) =>
        ((command) =>
          ((this.commands[command] ||
            log({
              error: `command '${command}' does not exist`,
            })) &&
            this.commands[command]?.(this, update, [...text_args, ...args])) ||
          // run the command
          this.updates.default)(this.getCommand(text_args)))(
        // get the command to run
        text
          .trimStart()
          .replace(/^([^\s]*\s)\s*/gm, "$1")
          .split(" ")
      )) ??
    this.updates.default;

  // execute the inline custom bot commands from bot configurations
  executeInlineCommand = async (update: TelegramUpdate): Promise<Response> =>
    ((await this._executeCommand(update, update.inline_query?.query ?? '')) &&
      (await this._executeCommand(
        update,
        "inline",
        update.inline_query?.query.trimStart().split(" ")
      ))) ??
    this.updates.default;

  // execute the custom bot commands from bot configurations
  executeCommand = async (update: TelegramUpdate): Promise<Response> =>
    this._executeCommand(update, update.message?.text ?? '') || this.updates.default;

  // trigger answerInlineQuery command of BotAPI
  answerInlineQuery = async (
    inline_query_id: number,
    results: TelegramInlineQueryResult[],
    cache_time = 0
  ) => fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/answerInlineQuery`), {
          inline_query_id: inline_query_id.toString(),
          results: JSON.stringify(results),
          cache_time: cache_time.toString(),
        }).href
      )
    );

  // trigger sendMessage command of BotAPI
  sendMessage = async (
    chat_id: number,
    text: string,
    parse_mode = "",
    disable_web_page_preview = false,
    disable_notification = false,
    reply_to_message_id = 0
  ): Promise<Response> =>
    fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/sendMessage`), {
          chat_id: chat_id.toString(),
          text,
          parse_mode: parse_mode,
          disable_web_page_preview: disable_web_page_preview.toString(),
          disable_notification: disable_notification.toString(),
          reply_to_message_id: reply_to_message_id.toString(),
        }).href
      )
    );

  // trigger forwardMessage command of BotAPI
  forwardMessage = async (
    chat_id: number,
    from_chat_id: number,
    disable_notification = false,
    message_id: number
  ) =>
    fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/sendMessage`), {
          chat_id: chat_id.toString(),
          from_chat_id: from_chat_id.toString(),
          message_id: message_id.toString(),
          disable_notification: disable_notification.toString(),
        }).href
      )
    );

  // trigger sendPhoto command of BotAPI
  sendPhoto = async (
    chat_id: number,
    photo: string,
    caption = "",
    parse_mode = "",
    disable_notification = false,
    reply_to_message_id = 0,
  ) =>
    fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/sendPhoto`), {
          chat_id: chat_id.toString(),
          photo,
          caption,
          parse_mode,
          disable_notification: disable_notification.toString(),
          reply_to_message_id: reply_to_message_id.toString(),
        }).href
      )
    );

  // trigger sendVideo command of BotAPI
  sendVideo = async (
    chat_id: number,
    video: Blob,
    duration = 0,
    width = 0,
    height = 0,
    thumb = "",
    caption = "",
    parse_mode = "",
    supports_streaming = false,
    disable_notification = false,
    reply_to_message_id = 0
  ) =>
    fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/sendVideo`), {
          chat_id: chat_id.toString(),
          video: JSON.stringify(video),
          duration: duration.toString(),
          width: width.toString(),
          height: height.toString(),
          thumb: thumb,
          caption: caption,
          parse_mode: parse_mode,
          supports_streaming: supports_streaming.toString(),
          disable_notification: disable_notification.toString(),
          reply_to_message_id: reply_to_message_id.toString(),
        }).href
      )
    );

  // trigger sendAnimation command of BotAPI
  sendAnimation = async (
    chat_id: number,
    animation: Blob,
    duration = 0,
    width = 0,
    height = 0,
    thumb = "",
    caption = "",
    parse_mode = "",
    disable_notification = false,
    reply_to_message_id = 0
  ) =>
    fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/sendAnimation`), {
          chat_id: chat_id.toString(),
          animation: JSON.stringify(animation),
          duration: duration.toString(),
          width: width.toString(),
          height: height.toString(),
          thumb,
          caption,
          parse_mode,
          disable_notification: disable_notification.toString(),
          reply_to_message_id: reply_to_message_id.toString(),
        }).href
      )
    );

  // trigger sendLocation command of BotAPI
  sendLocation = async (
    chat_id: number,
    latitude: number,
    longitude: number,
    live_period = 0,
    disable_notification = false,
    reply_to_message_id = 0
  ) =>
    fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/sendLocation`), {
          chat_id: chat_id.toString(),
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          live_period: live_period.toString(),
          disable_notification: disable_notification.toString(),
          reply_to_message_id: reply_to_message_id.toString(),
        }).href
      )
    );

  // trigger senPoll command of BotAPI
  sendPoll = async (
    chat_id: number,
    question: string,
    options: string[],
    is_anonymous = false,
    type = "",
    allows_multiple_answers = false,
    correct_option_id = 0,
    explanation = "",
    explanation_parse_mode = "",
    open_period = 0,
    close_date = 0,
    is_closed = false,
    disable_notification = false,
    reply_to_message_id = 0
  ) =>
    fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/sendPoll`), {
          chat_id: chat_id.toString(),
          question,
          options: options.toString(),
          is_anonymous: is_anonymous.toString(),
          type,
          allows_multiple_answers: allows_multiple_answers.toString(),
          correct_option_id: correct_option_id.toString(),
          explanation: explanation,
          explanation_parse_mode: explanation_parse_mode,
          open_period: open_period.toString(),
          close_date: close_date.toString(),
          is_closed: is_closed.toString(),
          disable_notification: disable_notification.toString(),
          reply_to_message_id: reply_to_message_id.toString(),
        }).href
      )
    );

  // trigger senDice command of BotAPI
  sendDice = async (
    chat_id: number,
    emoji = "",
    disable_notification = false,
    reply_to_message_id = 0
  ) =>
    fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/sendDice`), {
          chat_id: chat_id.toString(),
          emoji,
          disable_notification: disable_notification.toString(),
          reply_to_message_id: reply_to_message_id.toString(),
        }).href
      )
    );

  // bot api command to get user profile photos
  getUserProfilePhotos = async (
    user_id: number,
    offset = 0,
    limit = 0
  ): Promise<Response> =>
    fetch(
      log(
        addSearchParams(new URL(`${this.webhook.api.href}/getUserProfilePhotos`), {
          user_id: user_id.toString(),
          offset: offset.toString(),
          limit: limit.toString(),
        }).href
      )
    );
}