// Practice exercises for the tenses. Hand-written so every answer is right and every wrong option is really wrong.
//
//   fill      "She ____ (work) in a bank."       `answers`: every accepted answer for the blank (the app also accepts
//                                                 contracted forms: "doesn't" for "does not")
//   choose    "The sun ____ in the east."        `answer` and three `wrong` options; the order is shuffled when served
//   fix       "She don't like spicy food."       `answers`: every accepted corrected sentence
//   identify  "The bus leaves at eight."         "Which tense is this?" The options are built when served
//
// Rule for authors: a wrong option must be wrong *in that sentence*, never just less common.

const fill = (tense, prompt, answers, why) => ({ type: 'fill', tense, prompt, answers: [answers].flat(), why });
const choose = (tense, prompt, answer, wrong, why) => ({ type: 'choose', tense, prompt, answer, wrong, why });
const fix = (tense, prompt, answers, why) => ({ type: 'fix', tense, prompt, answers: [answers].flat(), why });
const identify = (tense, prompt, why) => ({ type: 'identify', tense, prompt, why });

const RAW = [
  // ---- Present simple ----
  fill('present-simple', 'My brother ____ (work) in a hospital.', 'works', 'With he / she / it, add -s: he works.'),
  fill('present-simple', 'We ____ (not / eat) meat on Fridays.', 'do not eat', 'The negative is do not + the base verb.'),
  fill('present-simple', 'How often ____ (you / go) to the gym?', 'do you go', 'A question uses do / does + subject + the base verb.'),
  choose('present-simple', 'The sun ____ in the east.', 'rises', ['rise', 'is rising', 'rose'], 'A fact that is always true takes the present simple, and he / she / it needs -s.'),
  choose('present-simple', 'He usually ____ coffee in the morning.', 'drinks', ['drink', 'is drinking', 'drank'], 'A habit (usually) takes the present simple, and he needs -s.'),
  fix('present-simple', 'She don’t like spicy food.', ['She doesn’t like spicy food.', 'She does not like spicy food.'], 'With she, use doesn’t, not don’t.'),
  identify('present-simple', 'The bus leaves at half past eight every day.', 'A regular schedule: present simple.'),

  // ---- Present continuous ----
  fill('present-continuous', 'Be quiet! The baby ____ (sleep).', 'is sleeping', 'It is happening now: is + verb-ing.'),
  fill('present-continuous', 'I ____ (not / watch) TV right now.', 'am not watching', 'Now: am / is / are + not + verb-ing.'),
  fill('present-continuous', 'What ____ (they / do) at the moment?', 'are they doing', 'A question about now: are + subject + verb-ing.'),
  choose('present-continuous', 'Look! It ____ outside.', 'is raining', ['rains', 'rained', 'has rained'], '“Look!” points to something happening now: present continuous.'),
  choose('present-continuous', 'We ____ to the cinema tonight. I’ve already bought the tickets.', 'are going', ['went', 'have gone', 'going'], 'A fixed plan for the near future can use the present continuous.'),
  fix('present-continuous', 'I am knowing the answer.', 'I know the answer.', 'Know is a verb of state, so it is not used in the continuous.'),
  identify('present-continuous', 'She is studying for her exam at the moment.', 'at the moment + is + verb-ing: present continuous.'),

  // ---- Present perfect ----
  fill('present-perfect', 'I ____ (finish) my homework. Can we go out now?', 'have finished', 'A past action with a result now: have + past participle.'),
  fill('present-perfect', 'She ____ (live) in this city for ten years.', 'has lived', 'Still true now, with for: she has lived.'),
  fill('present-perfect', '____ (you / ever / eat) sushi?', 'have you ever eaten', 'A life experience with no time given: have you ever + past participle.'),
  choose('present-perfect', 'I ____ him since 2018.', 'have known', ['know', 'knew', 'am knowing'], 'Since + a starting point, still true now: present perfect.'),
  choose('present-perfect', 'She ____ three books so far this month.', 'has read', ['reads', 'is reading', 'will read'], 'So far, with a result up to now: present perfect.'),
  fix('present-perfect', 'I have seen him yesterday.', 'I saw him yesterday.', 'Yesterday is a finished time, so it takes the past simple.'),
  identify('present-perfect', 'We have lived here since 2015.', 'since + a starting point, still true now: present perfect.'),

  // ---- Present perfect continuous ----
  fill('present-perfect-continuous', 'I ____ (wait) for you for an hour!', 'have been waiting', 'Still going on, with for: have been + verb-ing.'),
  fill('present-perfect-continuous', 'How long ____ (she / learn) English?', 'has she been learning', 'How long, up to now: has + subject + been + verb-ing.'),
  fill('present-perfect-continuous', 'It ____ (rain) all day, so the ground is wet.', 'has been raining', 'The rain went on up to now and you can see the result.'),
  choose('present-perfect-continuous', 'I’m tired because I ____ all morning.', 'have been working', ['work', 'am working', 'will work'], 'An activity that went on up to now, with a result: present perfect continuous.'),
  choose('present-perfect-continuous', 'The neighbours ____ the same song for hours, and it is still on!', 'have been playing', ['play', 'are playing', 'will play'], 'For hours, up to now and not finished: present perfect continuous.'),
  fix('present-perfect-continuous', 'I am studying English since 2020.', ['I have been studying English since 2020.', 'I’ve been studying English since 2020.'], 'A period from 2020 up to now needs the present perfect continuous, not the present continuous.'),
  identify('present-perfect-continuous', 'He has been running for thirty minutes.', 'has been + verb-ing + for: present perfect continuous.'),

  // ---- Past simple ----
  fill('past-simple', 'We ____ (visit) Paris last summer.', 'visited', 'A finished action at a past time: verb + -ed.'),
  fill('past-simple', 'She ____ (not / go) to work yesterday.', 'did not go', 'The negative is did not + the base verb.'),
  fill('past-simple', '____ (you / see) the match last night?', 'did you see', 'A question uses did + subject + the base verb.'),
  choose('past-simple', 'I ____ a great film on Saturday.', 'watched', ['have watched', 'watch', 'am watching'], 'On Saturday is a finished time: past simple.'),
  choose('past-simple', 'When ____ you move to this city?', 'did', ['do', 'have', 'were'], 'A question about a finished time starts with did.'),
  fix('past-simple', 'Did you went to the party?', 'Did you go to the party?', 'After did, use the base verb: go.'),
  identify('past-simple', 'They arrived at midnight.', 'A finished action at a definite time: past simple.'),

  // ---- Past continuous ----
  fill('past-continuous', 'At eight o’clock last night I ____ (cook) dinner.', 'was cooking', 'In progress at a past moment: was + verb-ing.'),
  fill('past-continuous', 'They ____ (not / listen) while the teacher was talking.', 'were not listening', 'In progress in the past: were + not + verb-ing.'),
  fill('past-continuous', 'What ____ (you / do) when I called you?', 'were you doing', 'A question about what was in progress: were + subject + verb-ing.'),
  choose('past-continuous', 'I ____ home when it started to rain.', 'was walking', ['walk', 'am walking', 'have walked'], 'The longer action in progress is the past continuous; the rain that interrupts is the past simple.'),
  choose('past-continuous', 'While she ____ , the phone rang.', 'was cooking', ['cooks', 'has cooked', 'is cooking'], 'An action in progress when something happened: was + verb-ing.'),
  fix('past-continuous', 'I was walk to school when I saw him.', 'I was walking to school when I saw him.', 'After was / were the verb needs -ing.'),
  identify('past-continuous', 'She was reading when the lights went out.', 'was + verb-ing for the action in progress: past continuous.'),

  // ---- Past perfect ----
  fill('past-perfect', 'When we arrived, the film ____ (already / start).', 'had already started', 'The earlier past action: had + past participle.'),
  fill('past-perfect', 'I ____ (never / see) snow before I moved to Canada.', 'had never seen', 'Before another past moment: had + past participle.'),
  fill('past-perfect', 'She was upset because he ____ (forget) her birthday.', 'had forgotten', 'The reason happened earlier than the past situation: past perfect.'),
  choose('past-perfect', 'By the time I got to the station, the train ____.', 'had left', ['has left', 'leaves', 'is leaving'], 'The train left before I arrived: the earlier action takes the past perfect.'),
  choose('past-perfect', 'He told me that he ____ the report already.', 'had finished', ['has finished', 'finishes', 'is finishing'], 'In reported speech after a past verb, the earlier action is in the past perfect.'),
  fix('past-perfect', 'When I arrived, the concert already started.', 'When I arrived, the concert had already started.', 'The concert started first, so it takes the past perfect.'),
  identify('past-perfect', 'They had eaten before we got there.', 'The earlier of two past actions: past perfect.'),

  // ---- Past perfect continuous ----
  fill('past-perfect-continuous', 'She was tired because she ____ (work) since six in the morning.', 'had been working', 'How long before a past moment: had been + verb-ing.'),
  fill('past-perfect-continuous', 'They ____ (wait) for two hours when the bus finally came.', 'had been waiting', 'Duration before a past moment: had been + verb-ing.'),
  fill('past-perfect-continuous', 'How long ____ (you / study) before the exam?', 'had you been studying', 'A question: had + subject + been + verb-ing.'),
  choose('past-perfect-continuous', 'His hands were dirty. He ____ in the garden.', 'had been working', ['has been working', 'was work', 'works'], 'The activity before the past moment explains the result: past perfect continuous.'),
  choose('past-perfect-continuous', 'I ____ for an hour when she arrived.', 'had been waiting', ['have been waiting', 'am waiting', 'wait'], 'For an hour, before a past moment: past perfect continuous.'),
  fix('past-perfect-continuous', 'She was waiting for two hours when I arrived.', 'She had been waiting for two hours when I arrived.', 'How long before a past moment takes the past perfect continuous.'),
  identify('past-perfect-continuous', 'We had been walking for hours when we found the village.', 'had been + verb-ing + for hours: past perfect continuous.'),

  // ---- Future with will ----
  fill('future-will', 'It’s cold in here. I ____ (close) the window.', 'will close', 'A decision made now: will + base verb.'),
  fill('future-will', 'I think it ____ (rain) tomorrow.', 'will rain', 'A prediction from opinion (I think): will + base verb.'),
  fill('future-will', 'Don’t worry. I ____ (not / tell) anyone your secret.', 'will not tell', 'A promise: will not + base verb.'),
  choose('future-will', 'I promise I ____ you tomorrow.', 'will call', ['call', 'called', 'have called'], 'A promise takes will + base verb.'),
  choose('future-will', 'A: There’s no milk. B: Oh, I ____ some from the shop.', 'will get', ['get', 'got', 'have gotten'], 'A decision made at the moment of speaking: will + base verb.'),
  fix('future-will', 'I will to call you later.', 'I will call you later.', 'After will use the base verb without to.'),
  identify('future-will', 'I’ll help you carry those bags.', 'An offer: will + base verb.'),

  // ---- Future with going to ----
  fill('future-going-to', 'We ____ (go) to Spain this summer. We’ve booked the flights.', 'are going to go', 'A plan already made: am / is / are + going to + base verb.'),
  fill('future-going-to', 'Look at those clouds! It ____ (rain).', 'is going to rain', 'A prediction from what you can see: is going to + base verb.'),
  fill('future-going-to', '____ (you / apply) for the job?', 'are you going to apply', 'A question about a plan: are + subject + going to + base verb.'),
  choose('future-going-to', 'She ____ a doctor. She has already chosen her university.', 'is going to be', ['is being', 'was', 'be'], 'An intention she has already decided on: going to.'),
  choose('future-going-to', 'Watch out! That glass ____ fall.', 'is going to', ['will to', 'goes to', 'is go to'], 'You can see it about to happen: is going to + base verb.'),
  fix('future-going-to', 'I going to start a new job next month.', ['I am going to start a new job next month.', 'I’m going to start a new job next month.'], 'Do not forget am / is / are before going to.'),
  identify('future-going-to', 'We’re going to repaint the kitchen next weekend.', 'A plan already made: going to.'),

  // ---- Future continuous ----
  fill('future-continuous', 'This time tomorrow I ____ (fly) to Rome.', 'will be flying', 'In progress at a future moment: will be + verb-ing.'),
  fill('future-continuous', 'Don’t call at eight. We ____ (have) dinner.', 'will be having', 'In progress at eight o’clock: will be + verb-ing.'),
  fill('future-continuous', '____ (you / use) the car tonight?', 'will you be using', 'A polite question about someone’s plans: will + subject + be + verb-ing.'),
  choose('future-continuous', 'At nine tomorrow morning she ____ her driving test.', 'will be taking', ['takes', 'will taking', 'took'], 'In progress at a future time: will be + verb-ing.'),
  choose('future-continuous', 'At this time next week I ____ on a beach in Greece.', 'will be lying', ['lie', 'lay', 'have lain'], 'In progress at a future moment: will be + verb-ing.'),
  fix('future-continuous', 'At eight tomorrow I will sleeping.', 'At eight tomorrow I will be sleeping.', 'You need be between will and the -ing form.'),
  identify('future-continuous', 'In an hour, I will be sitting in the exam room.', 'will be + verb-ing at a future moment: future continuous.'),

  // ---- Future perfect ----
  fill('future-perfect', 'By Friday I ____ (finish) the report.', 'will have finished', 'Finished before a future time: will have + past participle.'),
  fill('future-perfect', 'By the time you arrive, we ____ (eat).', 'will have eaten', 'Already done before a future moment: will have + past participle.'),
  fill('future-perfect', '____ (she / graduate) by 2030?', 'will she have graduated', 'A question: will + subject + have + past participle.'),
  choose('future-perfect', 'By next year, they ____ the house.', 'will have built', ['have built', 'built', 'will having built'], 'Finished before a future time: will have + past participle.'),
  choose('future-perfect', 'I ____ my degree by June.', 'will have finished', ['finish', 'will finishing', 'have finish'], 'By June, already done: will have + past participle.'),
  fix('future-perfect', 'By the time you will arrive, we will have left.', 'By the time you arrive, we will have left.', 'After by the time, use the present simple, not will.'),
  identify('future-perfect', 'By 2035, scientists will have found a cure.', 'By + a future time + will have + past participle: future perfect.'),
  // ---- More of each, so a full session of ten has variety ----

  // Present simple
  fill('present-simple', 'My parents ____ (live) in a small village.', 'live', 'Parents is plural (they), so there is no -s.'),
  fill('present-simple', 'Our flight ____ (leave) at six tomorrow morning.', 'leaves', 'A timetable uses the present simple, and it (the flight) needs -s.'),
  choose('present-simple', 'Water ____ at 100 degrees Celsius.', 'boils', ['is boiling', 'boiled', 'has boiled'], 'A scientific fact: present simple, with -s for it.'),
  fix('present-simple', 'He go to school by bus every day.', 'He goes to school by bus every day.', 'He needs -s, and go becomes goes.'),
  identify('present-simple', 'I usually have breakfast at seven.', 'A habit (usually): present simple.'),

  // Present continuous
  fill('present-continuous', 'Listen! Someone ____ (knock) at the door.', 'is knocking', 'It is happening now: is + verb-ing.'),
  fill('present-continuous', 'I can’t talk now. I ____ (drive).', 'am driving', 'At this moment: am + verb-ing.'),
  choose('present-continuous', 'Where is Tom? He ____ in the garden.', 'is working', ['works', 'worked', 'has worked'], 'He is there now, so the action is in progress: present continuous.'),
  fix('present-continuous', 'They are play football in the park now.', 'They are playing football in the park now.', 'After are the verb needs -ing.'),
  identify('present-continuous', 'We are staying at a hotel this week.', 'A temporary situation around now: present continuous.'),

  // Present perfect
  fill('present-perfect', 'He ____ (just / leave). You can catch him if you run.', 'has just left', 'Very recent news: has + just + past participle.'),
  fill('present-perfect', 'We ____ (not / see) each other for years.', 'have not seen', 'Up to now, with for: have not + past participle.'),
  choose('present-perfect', '____ you ever tried Thai food?', 'Have', ['Are', 'Do', 'Will'], 'A life experience: Have you ever + past participle?'),
  fix('present-perfect', 'She has live in Spain for five years.', 'She has lived in Spain for five years.', 'After has use the past participle: lived.'),
  identify('present-perfect', 'I’ve already eaten, thanks.', 'already + have / has + past participle: present perfect.'),

  // Present perfect continuous
  fill('present-perfect-continuous', 'Why are your clothes so dirty? — I ____ (work) in the garden.', 'have been working', 'An activity that has just stopped, with a visible result.'),
  fill('present-perfect-continuous', 'We ____ (look) for a flat for months, but we haven’t found one yet.', 'have been looking', 'Still going on, with for months: have been + verb-ing.'),
  choose('present-perfect-continuous', 'You look exhausted. What ____?', 'have you been doing', ['do you do', 'will you do', 'had you do'], 'You can see the result of an activity that has just stopped.'),
  fix('present-perfect-continuous', 'He is working here since 2015.', ['He has been working here since 2015.', 'He’s been working here since 2015.'], 'A period from 2015 up to now needs the present perfect continuous.'),
  identify('present-perfect-continuous', 'She has been learning the piano since she was six.', 'has been + verb-ing + since: present perfect continuous.'),

  // Past simple
  fill('past-simple', 'I ____ (buy) this jacket in Paris last year.', 'bought', 'Buy is irregular: bought. Last year is a finished time.'),
  fill('past-simple', 'He ____ (not / call) me last night.', 'did not call', 'The negative is did not + the base verb.'),
  choose('past-simple', 'We ____ to the beach every summer when I was a child.', 'went', ['go', 'have gone', 'are going'], 'A past habit that is over: past simple.'),
  fix('past-simple', 'She buyed a new phone yesterday.', 'She bought a new phone yesterday.', 'Buy is irregular: bought.'),
  identify('past-simple', 'I lost my wallet on the train last week.', 'A finished action at a past time (last week): past simple.'),

  // Past continuous
  fill('past-continuous', 'I ____ (walk) in the park when I met my old teacher.', 'was walking', 'In progress when something happened: was + verb-ing.'),
  fill('past-continuous', 'While we ____ (have) lunch, it started to rain.', 'were having', 'In progress in the past: were + verb-ing.'),
  choose('past-continuous', 'What ____ at nine o’clock last night?', 'were you doing', ['are you doing', 'you were doing', 'have you done'], 'In progress at a past moment: were + subject + verb-ing.'),
  fix('past-continuous', 'I was watch TV when the phone rang.', 'I was watching TV when the phone rang.', 'After was the verb needs -ing.'),
  identify('past-continuous', 'They were playing cards while it was raining.', 'Two actions in progress at the same time: past continuous.'),

  // Past perfect
  fill('past-perfect', 'She ____ (already / leave) when I called her.', 'had already left', 'She left first: had + past participle.'),
  fill('past-perfect', 'We couldn’t get in because we ____ (forget) the key.', 'had forgotten', 'The reason happened earlier: past perfect.'),
  choose('past-perfect', 'After he ____ his dinner, he went for a walk.', 'had finished', ['has finished', 'finishes', 'finishing'], 'Finishing came before the walk: past perfect.'),
  fix('past-perfect', 'I had saw that film before.', 'I had seen that film before.', 'After had use the past participle: seen.'),
  identify('past-perfect', 'She said she had never been to Italy.', 'Reported speech about an earlier time: past perfect.'),

  // Past perfect continuous
  fill('past-perfect-continuous', 'He was out of breath because he ____ (run).', 'had been running', 'The activity before the past moment explains the result.'),
  fill('past-perfect-continuous', 'They ____ (live) in Paris for ten years before they moved to Rome.', 'had been living', 'How long before a past moment: had been + verb-ing.'),
  choose('past-perfect-continuous', 'The ground was wet. It ____ all night.', 'had been raining', ['has been raining', 'was rain', 'rains'], 'The rain went on before the past moment and explains the wet ground.'),
  fix('past-perfect-continuous', 'He had been waiting for hours when she was arriving.', 'He had been waiting for hours when she arrived.', 'The short event that comes after is in the past simple.'),
  identify('past-perfect-continuous', 'I had been working all day, so I was exhausted.', 'had been + verb-ing: past perfect continuous.'),

  // Future with will
  fill('future-will', 'Perhaps it ____ (be) sunny tomorrow.', 'will be', 'A prediction (perhaps): will + base verb.'),
  fill('future-will', 'Wait here. I ____ (get) you a glass of water.', 'will get', 'An offer: will + base verb.'),
  choose('future-will', 'I’m sure she ____ the exam.', 'will pass', ['passed', 'is pass', 'pass'], 'A prediction (I’m sure): will + base verb.'),
  fix('future-will', 'I think it will to be a great party.', 'I think it will be a great party.', 'After will use the base verb without to.'),
  identify('future-will', 'Don’t worry, I will pay for the tickets.', 'A promise or offer: will + base verb.'),

  // Future with going to
  fill('future-going-to', 'I ____ (buy) a new laptop next week. I’ve saved enough money.', 'am going to buy', 'A plan already made: am going to + base verb.'),
  fill('future-going-to', 'He ____ (not / pass) the exam. He hasn’t studied at all.', 'is not going to pass', 'A prediction from evidence: is not going to + base verb.'),
  choose('future-going-to', 'We ____ get married in June. We’ve booked the church.', 'are going to', ['will to', 'are go to', 'going to'], 'A plan already made: are going to.'),
  fix('future-going-to', 'She is going to buys a car.', 'She is going to buy a car.', 'After going to use the base verb.'),
  identify('future-going-to', 'Look at that car! It’s going to crash.', 'A prediction from what you can see: going to.'),

  // Future continuous
  fill('future-continuous', 'Don’t phone me at nine. I ____ (watch) the match.', 'will be watching', 'In progress at nine: will be + verb-ing.'),
  fill('future-continuous', 'This time next year, we ____ (live) in Canada.', 'will be living', 'In progress at a future time: will be + verb-ing.'),
  choose('future-continuous', 'At six tomorrow I ____ in the office.', 'will be working', ['work', 'worked', 'have worked'], 'In progress at a future time: will be + verb-ing.'),
  fix('future-continuous', 'At seven tonight she will cooking dinner.', 'At seven tonight she will be cooking dinner.', 'You need be between will and the -ing form.'),
  identify('future-continuous', 'Next week at this time we will be lying on the beach.', 'will be + verb-ing at a future time: future continuous.'),

  // Future perfect
  fill('future-perfect', 'By next summer, she ____ (finish) her degree.', 'will have finished', 'Finished before a future time: will have + past participle.'),
  fill('future-perfect', '____ (they / arrive) by six?', 'will they have arrived', 'A question: will + subject + have + past participle.'),
  choose('future-perfect', 'By the end of the year, I ____ twenty books.', 'will have read', ['have read', 'will reading', 'read'], 'By + a future time: will have + past participle.'),
  fix('future-perfect', 'By 2040, we will have went to Mars.', 'By 2040, we will have gone to Mars.', 'After will have use the past participle: gone.'),
  identify('future-perfect', 'By the time you read this, I will have left.', 'will have + past participle: future perfect.'),
];

// A short stable id from the prompt, so a learner's results stay attached to an exercise if the list is reordered.
export function exerciseHash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export const TENSE_EXERCISES = RAW.map((e) => ({ ...e, id: `${e.tense}:${exerciseHash(e.prompt)}` }));
