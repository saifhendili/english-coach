// The English verb tenses, as lessons. Hand-written (not generated) so every rule and example is accurate.
//
// `timeline` is a tiny picture of when the action happens, on a line from PAST (0) through NOW (50) to FUTURE (100):
//   { type: 'ticks', at: [..] }              a repeated action
//   { type: 'bar', from, to, open? }         an action over a period ("open: 'right'" means it carries on)
//   { type: 'dot', at, link?, ref?, label? } one action; `link` joins it to now by a dotted line, `ref` is the
//                                            moment or action it is measured against (drawn hollow)
// The apps draw it; the numbers only say where things go.

export const TENSE_TIMES = ['present', 'past', 'future'];
export const TENSE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export const TENSES = [
  {
    id: 'present-simple',
    name: 'Present simple',
    time: 'present',
    level: 'A1',
    summary: 'Habits, routines, facts and timetables.',
    form: {
      affirmative: 'I/you/we/they + verb · he/she/it + verb + -s',
      negative: 'do not / does not + base verb',
      question: 'Do / Does + subject + base verb?',
    },
    formExamples: {
      affirmative: 'She works in a bank.',
      negative: 'She doesn’t work on Sundays.',
      question: 'Does she work here?',
    },
    uses: [
      { rule: 'Habits and routines', example: 'I drink tea every morning.' },
      { rule: 'Facts and things that are always true', example: 'Water boils at 100 degrees.' },
      { rule: 'Timetables and schedules', example: 'The train leaves at 9:15.' },
      { rule: 'Feelings and states (like, know, want)', example: 'I know the answer.' },
    ],
    signals: ['always', 'usually', 'often', 'sometimes', 'never', 'every day', 'on Mondays'],
    mistakes: [
      { wrong: 'She work in a bank.', right: 'She works in a bank.', why: 'He, she and it need -s in the present simple.' },
      { wrong: 'Does she works here?', right: 'Does she work here?', why: 'After do / does the verb goes back to its base form.' },
      { wrong: 'I am knowing the answer.', right: 'I know the answer.', why: 'Verbs of state (know, like, want) are not used in the continuous.' },
    ],
    contrast: { with: 'present-continuous', tip: 'A routine is present simple (I work here). Something happening right now is present continuous (I’m working).' },
    timeline: { marks: [{ type: 'ticks', at: [8, 20, 32, 44, 56, 68, 80, 92] }] },
  },
  {
    id: 'present-continuous',
    name: 'Present continuous',
    time: 'present',
    level: 'A1',
    summary: 'Things happening now or around now, and plans for the near future.',
    form: {
      affirmative: 'am / is / are + verb-ing',
      negative: 'am / is / are + not + verb-ing',
      question: 'Am / Is / Are + subject + verb-ing?',
    },
    formExamples: {
      affirmative: 'She is working right now.',
      negative: 'She isn’t working today.',
      question: 'Is she working?',
    },
    uses: [
      { rule: 'Happening at this moment', example: 'I’m writing an email.' },
      { rule: 'Temporary situations around now', example: 'I’m staying with my cousin this week.' },
      { rule: 'Changing or developing situations', example: 'Prices are rising.' },
      { rule: 'Fixed plans for the near future', example: 'We’re meeting at six tomorrow.' },
    ],
    signals: ['now', 'right now', 'at the moment', 'today', 'this week', 'currently', 'these days'],
    mistakes: [
      { wrong: 'I am go to school now.', right: 'I am going to school now.', why: 'After am / is / are the verb needs -ing.' },
      { wrong: 'She is wanting a coffee.', right: 'She wants a coffee.', why: 'Verbs of state (want, need, know, like) are not used in the continuous.' },
      { wrong: 'He working now.', right: 'He is working now.', why: 'Do not forget am / is / are before the -ing form.' },
    ],
    contrast: { with: 'present-simple', tip: 'Present simple is what usually happens (I work here). Present continuous is what is happening now (I’m working).' },
    timeline: { marks: [{ type: 'bar', from: 40, to: 60 }] },
  },
  {
    id: 'present-perfect',
    name: 'Present perfect',
    time: 'present',
    level: 'B1',
    summary: 'Past actions that matter now, life experiences, and things that began in the past and continue.',
    form: {
      affirmative: 'have / has + past participle',
      negative: 'have / has + not + past participle',
      question: 'Have / Has + subject + past participle?',
    },
    formExamples: {
      affirmative: 'I have finished my homework.',
      negative: 'I haven’t seen that film.',
      question: 'Have you ever been to Spain?',
    },
    uses: [
      { rule: 'Life experiences (no exact time)', example: 'I’ve visited Japan twice.' },
      { rule: 'A past action with a result now', example: 'I’ve lost my keys, so I can’t get in.' },
      { rule: 'Something that began in the past and is still true (for / since)', example: 'She has lived here for ten years.' },
      { rule: 'Recent news (just, already, yet)', example: 'They’ve just arrived.' },
    ],
    signals: ['ever', 'never', 'just', 'already', 'yet', 'so far', 'for', 'since', 'recently'],
    mistakes: [
      { wrong: 'I have seen him yesterday.', right: 'I saw him yesterday.', why: 'With a finished time (yesterday, last week, in 2019) use the past simple.' },
      { wrong: 'I have lived here since five years.', right: 'I have lived here for five years.', why: 'Use for with a length of time and since with a starting point.' },
      { wrong: 'She has went home.', right: 'She has gone home.', why: 'After have / has use the past participle (gone), not the past simple (went).' },
    ],
    contrast: { with: 'past-simple', tip: 'A finished time (yesterday, in 2019) needs the past simple. No time, or a time that is not over (today, this week, ever), takes the present perfect.' },
    timeline: { marks: [{ type: 'dot', at: 28, link: true }] },
  },
  {
    id: 'present-perfect-continuous',
    name: 'Present perfect continuous',
    time: 'present',
    level: 'B2',
    summary: 'An action that began in the past and is still going on, or has just stopped with a result you can see.',
    form: {
      affirmative: 'have / has + been + verb-ing',
      negative: 'have / has + not + been + verb-ing',
      question: 'Have / Has + subject + been + verb-ing?',
    },
    formExamples: {
      affirmative: 'I have been studying for two hours.',
      negative: 'She hasn’t been sleeping well.',
      question: 'How long have you been waiting?',
    },
    uses: [
      { rule: 'An action that began in the past and continues now', example: 'I’ve been learning English since January.' },
      { rule: 'An action that has just stopped, with a result you can see', example: 'You’re out of breath. Have you been running?' },
      { rule: 'Asking or saying how long', example: 'How long have you been working here?' },
    ],
    signals: ['for', 'since', 'how long', 'lately', 'recently', 'all day'],
    mistakes: [
      { wrong: 'I am studying English since two years.', right: 'I have been studying English for two years.', why: 'For a period that goes up to now, use the present perfect continuous, not the present continuous.' },
      { wrong: 'I have been knowing him for years.', right: 'I have known him for years.', why: 'Verbs of state (know, like, be) are not used in the continuous.' },
      { wrong: 'She has been work all day.', right: 'She has been working all day.', why: 'After been the verb needs -ing.' },
    ],
    contrast: { with: 'present-perfect', tip: 'Continuous stresses the activity and how long it lasted (I’ve been reading all day). Simple stresses the result or how many (I’ve read three chapters).' },
    timeline: { marks: [{ type: 'bar', from: 22, to: 50, open: 'right' }] },
  },
  {
    id: 'past-simple',
    name: 'Past simple',
    time: 'past',
    level: 'A2',
    summary: 'Finished actions at a definite time in the past.',
    form: {
      affirmative: 'verb + -ed (regular) · the past form (irregular)',
      negative: 'did not + base verb',
      question: 'Did + subject + base verb?',
    },
    formExamples: {
      affirmative: 'We visited Paris last year.',
      negative: 'We didn’t visit Rome.',
      question: 'Did you visit Rome?',
    },
    uses: [
      { rule: 'A finished action at a specific past time', example: 'I met him yesterday.' },
      { rule: 'A series of actions in a story', example: 'He opened the door, looked inside and left.' },
      { rule: 'Past habits and states that are over', example: 'We lived in Lyon when I was a child.' },
    ],
    signals: ['yesterday', 'last week', 'in 2019', 'ago', 'when I was young', 'then'],
    mistakes: [
      { wrong: 'Did you went there?', right: 'Did you go there?', why: 'After did / didn’t the verb is in its base form.' },
      { wrong: 'I didn’t saw him.', right: 'I didn’t see him.', why: 'After did / didn’t the verb is in its base form.' },
      { wrong: 'She buyed a car.', right: 'She bought a car.', why: 'Buy is irregular: buy, bought, bought.' },
    ],
    contrast: { with: 'present-perfect', tip: 'Past simple: it is over and you say when (I saw it in May). Present perfect: it connects to now and you do not say when (I’ve seen it).' },
    timeline: { marks: [{ type: 'dot', at: 25 }] },
  },
  {
    id: 'past-continuous',
    name: 'Past continuous',
    time: 'past',
    level: 'A2',
    summary: 'An action that was in progress at a moment in the past, often interrupted by something else.',
    form: {
      affirmative: 'was / were + verb-ing',
      negative: 'was / were + not + verb-ing',
      question: 'Was / Were + subject + verb-ing?',
    },
    formExamples: {
      affirmative: 'I was cooking when you called.',
      negative: 'I wasn’t sleeping.',
      question: 'What were you doing at eight?',
    },
    uses: [
      { rule: 'In progress at a specific past moment', example: 'At 8 pm I was watching TV.' },
      { rule: 'An interrupted action (past continuous + past simple)', example: 'I was walking home when it started to rain.' },
      { rule: 'Two actions happening at the same time', example: 'She was cooking while he was cleaning.' },
      { rule: 'The background of a story', example: 'The sun was shining and the birds were singing.' },
    ],
    signals: ['while', 'when', 'as', 'at that moment', 'at 8 pm yesterday', 'all evening'],
    mistakes: [
      { wrong: 'I was walk home when it rained.', right: 'I was walking home when it rained.', why: 'After was / were the verb needs -ing.' },
      { wrong: 'While I was cooked, the phone rang.', right: 'While I was cooking, the phone rang.', why: 'The longer action in progress takes -ing, not the past form.' },
      { wrong: 'We were having dinner when she was arriving.', right: 'We were having dinner when she arrived.', why: 'The short event that interrupts is in the past simple.' },
    ],
    contrast: { with: 'past-simple', tip: 'Past simple: the action was completed (I cooked dinner). Past continuous: it was in progress (I was cooking when you called).' },
    timeline: { marks: [{ type: 'bar', from: 16, to: 34 }] },
  },
  {
    id: 'past-perfect',
    name: 'Past perfect',
    time: 'past',
    level: 'B2',
    summary: 'The earlier of two past actions.',
    form: {
      affirmative: 'had + past participle',
      negative: 'had not + past participle',
      question: 'Had + subject + past participle?',
    },
    formExamples: {
      affirmative: 'When I arrived, the film had started.',
      negative: 'She hadn’t eaten.',
      question: 'Had you met him before?',
    },
    uses: [
      { rule: 'An action finished before another past action', example: 'The train had left when we got to the station.' },
      { rule: 'The reason for a past situation', example: 'He was tired because he hadn’t slept.' },
      { rule: 'Reported speech (the past of the present perfect)', example: 'She said she had finished.' },
      { rule: 'With by the time', example: 'By the time we arrived, they had gone.' },
    ],
    signals: ['before', 'after', 'already', 'by the time', 'when', 'never … before', 'just'],
    mistakes: [
      { wrong: 'When I arrived, the film already started.', right: 'When I arrived, the film had already started.', why: 'The earlier action is in the past perfect.' },
      { wrong: 'She told me that she has seen it before.', right: 'She told me that she had seen it before.', why: 'In reported speech after a past verb, the present perfect becomes the past perfect.' },
      { wrong: 'I had went home.', right: 'I had gone home.', why: 'After had use the past participle (gone), not the past simple (went).' },
    ],
    contrast: { with: 'past-simple', tip: 'With two past events, the first one is in the past perfect and the second in the past simple: When I arrived, the film had started.' },
    timeline: { marks: [{ type: 'dot', at: 14, label: '1st' }, { type: 'dot', at: 32, ref: true, label: '2nd' }] },
  },
  {
    id: 'past-perfect-continuous',
    name: 'Past perfect continuous',
    time: 'past',
    level: 'C1',
    summary: 'How long something had been happening before another past moment.',
    form: {
      affirmative: 'had been + verb-ing',
      negative: 'had not been + verb-ing',
      question: 'Had + subject + been + verb-ing?',
    },
    formExamples: {
      affirmative: 'I had been waiting for an hour when she arrived.',
      negative: 'He hadn’t been sleeping well.',
      question: 'How long had you been working there?',
    },
    uses: [
      { rule: 'How long something went on before a past moment', example: 'They had been driving for six hours when the car broke down.' },
      { rule: 'The cause of a past situation', example: 'Her eyes were red. She had been crying.' },
    ],
    signals: ['for', 'since', 'how long', 'before', 'until', 'by the time'],
    mistakes: [
      { wrong: 'She was waiting for two hours when I arrived.', right: 'She had been waiting for two hours when I arrived.', why: 'For how long something had gone on before a past moment, use the past perfect continuous.' },
      { wrong: 'I had been wait for hours.', right: 'I had been waiting for hours.', why: 'After been the verb needs -ing.' },
      { wrong: 'He had been knowing her for years.', right: 'He had known her for years.', why: 'Verbs of state (know, like, be) are not used in the continuous.' },
    ],
    contrast: { with: 'past-perfect', tip: 'Continuous stresses how long or the activity (I had been reading for hours). Simple stresses that it was finished (I had read the book).' },
    timeline: { marks: [{ type: 'bar', from: 6, to: 28 }, { type: 'dot', at: 32, ref: true }] },
  },
  {
    id: 'future-will',
    name: 'Future with will',
    time: 'future',
    level: 'A2',
    summary: 'Decisions made now, promises, offers and predictions.',
    form: {
      affirmative: 'will + base verb (I’ll, she’ll…)',
      negative: 'will not (won’t) + base verb',
      question: 'Will + subject + base verb?',
    },
    formExamples: {
      affirmative: 'I’ll call you tonight.',
      negative: 'It won’t rain.',
      question: 'Will you help me?',
    },
    uses: [
      { rule: 'A decision made at the moment of speaking', example: 'It’s cold. I’ll close the window.' },
      { rule: 'Promises and offers', example: 'I’ll help you with that.' },
      { rule: 'Predictions based on opinion', example: 'I think it will be sunny tomorrow.' },
      { rule: 'Facts about the future', example: 'She will be 30 next year.' },
    ],
    signals: ['tomorrow', 'next week', 'soon', 'I think', 'probably', 'I’m sure', 'perhaps'],
    mistakes: [
      { wrong: 'I will to call you.', right: 'I will call you.', why: 'After will use the base verb without to.' },
      { wrong: 'She wills come.', right: 'She will come.', why: 'Will never takes -s.' },
      { wrong: 'If it will rain, we stay home.', right: 'If it rains, we will stay home.', why: 'After if, use the present simple, not will.' },
    ],
    contrast: { with: 'future-going-to', tip: 'Will: a decision now, or a prediction from opinion. Going to: a plan already made, or a prediction from what you can see.' },
    timeline: { marks: [{ type: 'dot', at: 76 }] },
  },
  {
    id: 'future-going-to',
    name: 'Future with going to',
    time: 'future',
    level: 'A2',
    summary: 'Plans you have already made, and predictions from what you can see.',
    form: {
      affirmative: 'am / is / are + going to + base verb',
      negative: 'am / is / are + not + going to + base verb',
      question: 'Am / Is / Are + subject + going to + base verb?',
    },
    formExamples: {
      affirmative: 'I’m going to study medicine.',
      negative: 'We aren’t going to travel this summer.',
      question: 'Are you going to apply?',
    },
    uses: [
      { rule: 'Plans and intentions', example: 'We’re going to move to a new flat.' },
      { rule: 'Predictions from evidence in the present', example: 'Look at those clouds. It’s going to rain.' },
    ],
    signals: ['tomorrow', 'next year', 'this weekend', 'soon', 'tonight'],
    mistakes: [
      { wrong: 'I going to call him.', right: 'I am going to call him.', why: 'Do not forget am / is / are before going to.' },
      { wrong: 'She is going to goes home.', right: 'She is going to go home.', why: 'After going to use the base verb.' },
      { wrong: 'It’s going to rains.', right: 'It’s going to rain.', why: 'After going to use the base verb, without -s.' },
    ],
    contrast: { with: 'future-will', tip: 'Going to: you already decided, or you can see it coming. Will: you decide now, or you are giving an opinion.' },
    timeline: { marks: [{ type: 'dot', at: 78, link: true }] },
  },
  {
    id: 'future-continuous',
    name: 'Future continuous',
    time: 'future',
    level: 'B2',
    summary: 'An action that will be in progress at a certain time in the future.',
    form: {
      affirmative: 'will be + verb-ing',
      negative: 'will not be + verb-ing',
      question: 'Will + subject + be + verb-ing?',
    },
    formExamples: {
      affirmative: 'This time tomorrow I will be flying to Rome.',
      negative: 'She won’t be working on Friday.',
      question: 'Will you be using the car tonight?',
    },
    uses: [
      { rule: 'In progress at a future moment', example: 'At nine tomorrow I’ll be sitting my exam.' },
      { rule: 'Polite questions about someone’s plans', example: 'Will you be joining us for dinner?' },
      { rule: 'Things that will happen in the normal course of events', example: 'I’ll be seeing her at the meeting anyway.' },
    ],
    signals: ['this time tomorrow', 'at 5 pm tomorrow', 'next week', 'in two hours'],
    mistakes: [
      { wrong: 'At eight tomorrow I will sleeping.', right: 'At eight tomorrow I will be sleeping.', why: 'You need be between will and the -ing form.' },
      { wrong: 'She will be know the answer.', right: 'She will know the answer.', why: 'Verbs of state (know, like, want) are not used in the continuous.' },
      { wrong: 'Will you be use the car?', right: 'Will you be using the car?', why: 'After be the verb needs -ing.' },
    ],
    contrast: { with: 'future-perfect', tip: 'Continuous: in progress at a time (at nine I’ll be working). Perfect: finished before a time (by nine I’ll have finished).' },
    timeline: { marks: [{ type: 'bar', from: 66, to: 86 }] },
  },
  {
    id: 'future-perfect',
    name: 'Future perfect',
    time: 'future',
    level: 'B2',
    summary: 'An action that will be finished before a certain time in the future.',
    form: {
      affirmative: 'will have + past participle',
      negative: 'will not have + past participle',
      question: 'Will + subject + have + past participle?',
    },
    formExamples: {
      affirmative: 'By Friday I will have finished the report.',
      negative: 'She won’t have arrived by six.',
      question: 'Will you have eaten by then?',
    },
    uses: [
      { rule: 'Finished before a future deadline', example: 'By 2030 I will have graduated.' },
      { rule: 'With by / by the time: something will already be done', example: 'By the time you get home, I’ll have cooked dinner.' },
    ],
    signals: ['by', 'by then', 'by the time', 'before', 'in two years'],
    mistakes: [
      { wrong: 'By next year I will finish my studies.', right: 'By next year I will have finished my studies.', why: 'Something finished before a future time takes the future perfect.' },
      { wrong: 'I will have went home by nine.', right: 'I will have gone home by nine.', why: 'After will have use the past participle (gone), not the past simple (went).' },
      { wrong: 'By the time you will arrive, we will have left.', right: 'By the time you arrive, we will have left.', why: 'After by the time, use the present simple, not will.' },
    ],
    contrast: { with: 'future-continuous', tip: 'Perfect: finished before a time (by nine I’ll have finished). Continuous: in progress at a time (at nine I’ll be working).' },
    timeline: { marks: [{ type: 'dot', at: 66, label: 'done' }, { type: 'dot', at: 88, ref: true, label: 'deadline' }] },
  },
];

export const tenseById = (id) => TENSES.find((t) => t.id === id);
