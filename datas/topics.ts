const enum RULES {
  NONE,
  MP4,
  FLAC,
  ROLE,
  ALL,
}

export const topics = [
  {
    name: "Шаблон називання файлів",
    message: `Для загальної зручності виношу на обов’язкове дотримання шаблон найменування фалів:

        Субтитри: {Назва} E{число двома знаками} {Мова: UKR, ENG} {Тип: DIALGUES, FULL, SIGNS, ROLES, FIXES}
        Приклад: 
        Kamonohashi Ron no Kindan Suiri E01 UKR FULL
        
        Озвучення: {Назва} E{число двома знаками} {Нік}
        Приклад: 
        Kamonohashi Ron no Kindan Suiri E01 Dixy
        
        Фікси: {Назва} E{число двома знаками} {Нік} F{число двома знаками}
        Приклад: 
        Kamonohashi Ron no Kindan Suiri E01 Dixy F01
        
        Зведений звук: {Назва} E{число двома знаками}
        Приклад: 
        Kamonohashi Ron no Kindan Suiri E01
        
        Відео: [Inari{SuB або DuB}] {Назва} S{число двома зканами}E{число двома знаками} {якість} 
        Приклад: [InariDuB] 
        Kamonohashi Ron no Kindan Suiri S01E01 1080p`,
    rule: RULES.NONE,
    color: 0xffd67e,
  },
  {
    name: "Озвучення",
    message: `Сюди кидаємо озвучення:`,
    rule: RULES.FLAC,
    color: 0x6FB9F0,
  },
  {
    name: "Озвучення",
    message: `Сюди кидаємо озвучення:`,
    rule: RULES.FLAC,
    color: 0xCB86DB,
  },
  {
    name: "Фікси",
    message: `Сюди фіксер пише фікси:`,
    rule: RULES.ROLE,
    color: 0x8EEE98,
  },
  {
    name: "Зведений звук",
    message: `Сюди звукар кидає зведений звук:`,
    rule: RULES.FLAC,
    color: 0xFF93B2,
  },
  {
    name: "Повні + написи",
    message: `Саби і написи:`,
    rule: RULES.ALL,
    color: 0xFB6F5F,
  },
  {
    name: "Реліз",
    message: `Готові серії:`,
    rule: RULES.MP4,
    color: 0x6FB9F0,
  },
  {
    name: "Ролі розбиття",
    message: `:`,
    rule: RULES.ALL,
    color: 0xFFD67E,
  },
  {
    name: "Графік",
    message: `:`,
    rule: RULES.ALL,
    color: 0xCB86DB,
  },
  {
    name: "Барахло",
    message: `:`,
    rule: RULES.ALL,
    color: 0x8EEE98,
  },
  {
    name: "Слухання",
    message: `:`,
    rule: RULES.ALL,
    color: 0xFF93B2,
  },
];
