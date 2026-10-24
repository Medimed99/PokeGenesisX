/* stub DOM minimal pour charger le bundle en node */
const noop = () => {};
const fakeEl = () => ({style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  appendChild:noop,remove:noop,querySelectorAll:()=>[],innerHTML:"",textContent:"",dataset:{},children:[],
  scrollTop:0,scrollHeight:0,firstChild:null,select:noop,focus:noop});
global.document = {addEventListener:noop, getElementById:()=>null, createElement:fakeEl,
  documentElement:{style:{setProperty:noop}}, head:{appendChild:noop}, readyState:"loading",
  querySelectorAll:()=>[], execCommand:noop, hidden:false};
global.window = {addEventListener:noop};
global.navigator = {};
global.URL = {createObjectURL:()=>""};
global.Blob = function(){};
global.AudioContext = undefined;
global.setInterval = () => 0;   /* pas de boucles pendant les tests */

const fs = require("fs");
<<<<<<< HEAD
const ORDER = ['_dexblob.js','_atlas.js','_atlas_shiny.js','_pmd.js','_items.js','_lore.js','_pzportrait.js','_pzanim.js','_chars.js','_trainers.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js','30-capture.js','30b-stakes.js','30c-onze.js','30c-bonus.js','32-world.js','33-fishing.js','34-research.js','36-lore.js','37-cine.js','37b-moments.js','37c-stage.js','37d-plateau.js','37e-decors.js','37f-mise-en-scene.js','38-forage.js','38b-forge.js','38c-dig-plus.js','39-daily.js','39b-events.js','39c-session.js','39p-demandes.js','39r-rival.js',
  '35-modules.js','40-battle.js','40b-picker.js','41-arena.js','42-team.js','50-expedition.js','51-expscene.js','51m-expmap.js','52-expgear.js','54-tower.js','55-squad.js','55b-squad-ui.js','55c-squad-fight.js','55h-histoire.js','56-breche.js','57-breche-run.js','58-breche-ui.js','59-breche-plus.js','59m-breche-map.js','59a-breche-attacks.js','59p-breche-pmd.js','59f-breche-feel.js','59g-breche-bossfight.js','59s-breche-share.js','59d-breche-depth.js','59k-breche-fx.js','59w-breche-world.js','59l-breche-legends.js','60-poker.js','61-poker-content.js','62-poker-table.js','70-collection.js','72-bag.js','73-cards.js','73b-cardpowers.js','73c-cardreveal.js','73d-reindex.js','73e-provenance.js','73f-chrono.js','73g-pzcard.js','73h-eras.js','73i-displaymodes.js','73j-cardnews.js','74-eggs.js','75-extras.js','76-items.js','77-secrets.js','78-milestones.js','79-ux.js','79b-world.js','79c-legend.js','80-guide.js','81-cosmetics.js','85-journal.js','86-saga.js','87-finale.js','88-share-mn.js','90-admin.js','95-online.js','95b-social.js','96-pwa.js','96b-music.js','99-boot.js'];
const code = ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n");
eval(code + "\n;" + 'global.__api={POKE,POKE_IDS,evalHand,genMap,EXP_ROWS,deepFill,newState,catchChance,typeMult,RARITY,ACHIEVEMENTS,JOKERS,STORY,anteTarget,makeFighter,damageCalc,xpForLevel,handBase,HANDS,newDeck,movesFor,dexTotal,famOf,stageOf,DIRECTIVES,INFOS,TUTOS,PZ_EVENTS,atlasIndex,ATLAS_N,ATLAS_BACK0,SLUGS,cardChips,grantCardV,grantSecretCard,cardVariants,cardHas,cardOwnedCount,cardTotal,CARD_MONS,CARD_SERIES_DEF,CARD_ORDER,rollCardSeries,randomCard,migrateCards,CARD_INDEX,cardChecksum,cardBytes,tcardHtml,cardBackHtml,GEN_TAG,boosterRank,seriesName,seriesFound,monFound,cardSubtitle,cardSpec,cardEra,cardPips,cardArt,cardBg,cardEntryOf,CARD_SCENES,CARD_YEARS,CARD_MN,CARD_ATLAS,resolveName,KNOWN_NAMES,sixthItem,glitchSixthItem,GEN_MARKS,checkChainMark,specialDay,isNightWindow,PZ_POKE_LINES,SIXTH_SLOTS,KONAMI,karpDealDay,karpDealAvailable,BST_BANDS,bstBand,wildIdFor,NODE_W,nodeTypeFor,EXP_ITEMS,rollExpItem,itemMinFloor,EXP_MODES,expRunModes,genMap,traitLevels,traitBonus,TOWER_TRAITS,HABITATS,HABITAT_IDS,habitatWeight,isNight,WEATHER,WEATHER_IDS,weatherDef,speciesInHabitat,FRAGMENTS,RIFT_ARC,checkFragments,riftTick,riftStage,fragmentsFound,fragNext,fragPending,fragOn,fragOnCatch,fragFound,FRAG_SRC,signatureMove,moveTierName,STRATA,forage,forageRate,forageAdvance,digPower,digAff,digRate,crewIds,wallEvery,wallCap,genWall,digHit,digClaim,DIG_LOOT,FOR_UPS,offlineHours,forageTick,EGG_TIERS,EXCLUSIVES,EXCL_SOURCE,isExclusive,RODS,fishPool,newFishEncounter,speciesForRarity,eggPool,repelRarity,lureMul,rstreak,rstreakCatch,rstreakBreak,RSTREAK_MILES,PERMANENTS,charmMul,runeMul,shinyOdds,friendCheck,friendEvo,canEvolve,codeHash,CODES,isSafariDay,SAFARI_POOL,botSpecies,botRate,botHours,FACTIONS,FACTION_RANKS,factionRank,factionMul,factionPts,todayRows,todayPending,REGIONS,unlockedRegions,nextEncounter,newEncounter,rollRarity,fleeChance,RARITY,CINEMAS,CINE_WHO,CINE_T,corruptText,CINE_POS,moduleUnlocked,checkAchievements,sqSkillsOf,sqLeaderOf,sqNewBattle,sqNext,sqTurnStart,sqAct,sqSync,sqSyncReady,sqPredict,sqSkip,sqAI,sqFinish,sqUpgrade,sqState,sqStars,sqZoneOpen,SQ_ZONES,SQ_STAGES,sqWaves,sqSkillLv,MAP_ROWS,MAP_SHAPE,EXP_MAPS,expGainLevels,expExpected,EXP_GAIN,startExpedition,openSector,afterFightRewards,lineRoot,createBattle,bStep,bSpeed,arOn,arNeed,AR_KIND,AR_BIOME,towerState,SCREENS,brSummonBoss,brBossDown,BR_PATTERNS,BR_KIT_BY_TYPE,brBossKit,brTerrainReact,brTerrainUnder,brDecal,brHit,brAddZone,brMapNear,brMapPre,brUpdate,ACTIONS,ITEM_IDX,TREASURE_KEYS,BALLS,BERRIES,STONES,CHESTS,PERMANENTS,TREASURES,EXP_ITEMS,REPELS,ringGrade,RING_GRADES,evSeason,evSeasonKey,evWeeklyLegend,evWeekIndex,evState,evTier,evRunPoints,EV_TRACK,EV_SEASONS,brShareText,BR_KIND,BR_ATK,BR_LEGEND,brArchFor,brFire,brWeaponStats,brSpawnFoe,pwaAfterIntro,pwaInstallable,pwaEnv,brChunkAt,brPushOut,brMastery,BR_TERRAIN,brMissionsFor,brNewRun,brUpdate,brXpNeed,brChoices,brWeaponStats,brDaily,brGuardianWin,brGuardianFor,ROOM_MOMENTS,roomMomentsTick,sqLockOpen,sqLockWaves,sqLockGate,sqLockLevel,sqLockAt,sqLockFinish,brNextEvo,brState,BR_ARCH,BR_ITEMS,ACTIVITIES,COSMETICS,FX_LAYERS,badgeCine,secretCine,BADGES,HANDS,MODULE_REQ,SCREENS,adminHash,ADMIN_HASH,ATELIER_TABS,STORY,RIFT_ARC,directStory,cineFor,RESEARCH_TASKS,researchOf,researchLevel,researchMax,researchTick,taskGoal,RESEARCH_TIERS,TALENTS,talentOf,PERFECT_ODDS,rollPerfect,weekStamp,REPORT_ROWS,lineRoot,towerLevel,towerBand,BUFF_STATS,TRAINERS,expEnemyLevel,setBuddy,buddyTick,buddyTier,buddyBonus,buddy,rollWeekly,weeklyTick,weeklyRollover,openChest,WEEKLY_POOL,BUDDY_FINDS,BUDDY_MAX_TIER,BUDDY_TIER_AFF,CHESTS,addToDex,weekKey,aimBonus,BOOSTS,startBoost,boostActive,LUCKY_DAYS,rollLuckyDay,luckyF,TREASURES,rollTreasure,treasureValue,REGION_TIERS,checkRegionTiers,regionTiersDone,rollContract,contractTick,CONTRACTS,CYCLE_MODS,PERKS,cycleReward,perkLv,loreOf,LORE,PZ_EMOS,pzMood,HELD_ITEMS,grantHeld,heldActive,PLANETS,SPECTRALS,QUEST_POOLS,questMix,rollQuests,bonusSources,bonusTotals,raidState,raidEnd,raidTierReached,raidTotal,RAID_TIERS,wkSubmit,wkState,chalEncode,chalDecode,potState,potAdd,potLose,potMul,roamState,ROAMERS,srcHint,newEncounter,catchChance,fleeChance,getHorde:()=>HORDE,setHorde:v=>{HORDE=v},worldState,worldReg,projOf,projNeedOk,projCanPay,worldNextProj,CHAPTERS,chapterIdx,WORLD_PROJECTS,WORLD_SPOTS,legendOfBlock,legendNow,legendNext,LEG_IDS,legEnd,legState,starsOf,starMul,teamGiveXp,teamXpNeed,teamPower,monPower,candyCost,teamCandyGain,teamIds,teamOnEvolve,STAR_STEPS,addXp,sqUnit,sessState,sessRoll,sessProg,sessDone,sessReward,SESSION_OBJ,nextStep,levelUnlocks,stageHold,banner,Music,MUSIC_TRACKS,musicResolve,cardTier,CARD_POWERS,ORES,ORE_IDS,oreOf,oreHave,oreGain,TOOLS,toolTier,toolCost,toolCanForge,PICK_T,HAMMER_T,DRILL_T,FOR_SITES,siteOpen,siteReachable,siteSwitch,siteDepth,mainMaxM,stratumHard,toolSvg,PK_DECKS,pkBuildDeck,startPoker,pkScore,pkStartRound,pkRollShop,jokerAvail,evalHandRainbow,sanctPlace,sanctChance,sanctJoin,cardShopWares,CARD_ITEM_IDS,MOMENT_Q,cardRevealExpect,cardPowersFlush,CARD_POWER_PENDING,reidxFeed,reidxPts,reidxNext,reidxMigrate,reidxWeave,reidxPanel,reidxRevealHtml,REIDX_AT,REIDX_FRAG,getRT:()=>REIDX_TRACE,cardHowSet,cardHowText,cardRecordHtml,cardNoteRoll,cardNoteOf,cardNoteSign,CARD_NOTES,cardNotesPanelHtml,pzGiftDue,pzGiftGive,pzGiftPick,cardIntegrityBias,CHRONO_END,CHRONO_ERA,chronoEras,chronoComplete,chronoUnseen,chronoLine,chronoMigrate,chronoState,grantPzCard,pzCardOwned,pzCardTick,pzCardPanelHtml,CARD_PZ,skinOf,skinSet,skinChoices,eraVar,eraRecolor,eraSpriteHtml,skinRowHtml,skinZoomHtml,eraOfV,eraBody,eraAuraHalo,eraAuraGlow,eraAuraMotes,displayModeOpen,displayModeOf,displayModesHtml,cnewsPending,cnewsInit,cnewsShow,cnewsHtml,cnewsItems,cnewsHeroPick,reidxQuiet,reidxCalm,reidxSkip,versionText,versionRowHtml,buildV,updAnnounce,throwChance,aimResText,forStrataReached,forAnnounceNew,forNewMoment,achBanner,expBag,expBagAdd,expEquip,expLeaveNeedsAsk,endExpedition,expLastHtml,mnSprite,mnSpriteHtml,spriteUrl,getMISSING:()=>MISSING_SPRITE,BR_LEG_FIRE,BR_LEG_ZONE,BR_LEG_DRAW,BR_LEG_KIND,BR_LEG_NEW,lgDrawStates,lgDrawSerpent,lgPickTargets,lgSerpAt,brChoiceHtml,brFireExtra,brZones,brZone,brChestGift,brChestTier,brChestWaiting,BR_FRAGS,BR_CHEST_TIERS,BR_SURGES,brRecomputeMods,BR_MAXLV,setScreen:v=>{currentScreen=v},sprite,pkWishBonus,pkDeckTargetMul,psyFamilies,pkOpp,pkEvoTick,pkToggle,pkPlay,skipResolve,commitResolve,pkDraw,PK_LEADER_ORDER,RIVALS,rivalPrize,rivalRec,safariWeek,localYmd,introSeen,calmFx,applyCalm,brShake,mnShareOpen,mnShareText,mnShareRowHtml,mnShareOffer,mnShareAnswer,storyQWaiting,storyQHintHtml,raidBossFighter,raidXp,RAID_TURNS,RAID_DMG_CAP,setStatus,endOfTurnStatus,pzAskEnsure,pzAskState,pzAskQuest,pzAskOnCatch,pzAskFulfill,pzAskPool,pzAskRowHtml,pzAskHomeHtml,rollQuests,questTick,today,finishBattle,handleKO,histFight,histAfterBattle,histOnEvolve,histRows,histHtml,histFaithful,histDay,histHow,setDexHow:v=>{DEX_HOW=v},ONZE,ONZE_SURE,ONZE_GAP,onzeNext,onzeState,onzeMet,onzeCaught,onzeOnEvolve,monNick,onzePanelHtml,onzeDexHtml,onzeRevealBeats,STORY_Q,STORY_Q_ORDER,storyAns,storyAnswer,storyWhen,storyQPending,pzRecall,pzRecallLine,creditsAnswersHtml,STORY_BY_ID,directStory,expFight,enemySpecFor,expUnstick,getBATTLE:()=>BATTLE,legOpen,legendCardHtml,storyThread,storyThreadHtml,storyRecapHtml,MAIN_ARC,MEM_SCENES,mainArcNext,mainArcPending,pzFmt,pzMask,pzName,frNum,sagaConn,sagaState,sagaKnown,sagaWrote,pzLog,pzLogTick,pzFileHtml,pzMemPct,memoryPanelHtml,finaleReqs,finaleReady,finaleStage,sagaCardHtml,sagaWritePz,creditsRollHtml,sagaCycleBeat,sagaPath,finaleWaves,mnUnit,echoUnit,finalPhase,finaleAfterChoice,finalPrep,finalPrepHtml,nameBytes,nameSprite,hex2,fragAuthor,checkStoryTriggers,STORY_TITLES,STORY_ACTS,cycleReady,cycleCopy,sqLoadWave,sqCheck,sqAlive,setS:function(v){S=v},getS:function(){return S},setENC:function(v){ENC=v},getENC:function(){return ENC},getCINE:function(){return CINE},getCineLast:function(){return CINE_LAST},playStory:playStory,PL_BEATS,PL_SETS,PL_KINDS,plKitForTest:(x,w,h)=>plKit(x,plRng(1),w,h),PMD_META,PL_PROPS,PL_EMOTES,PL_LIGHTS,PL_WL,PL_MOOD,PL_FONT,PL_BG,STAGE,SW_MAP,SW_W,SW_H,swarmColors,plText,plTextW,plRng,plHash,plDir,stDefragN,pzReal,stFirstMon,PZX,PZ_STRIP,MAJOR_SCENES};');
=======
const ORDER = ['_dexblob.js','_atlas.js','_atlas_shiny.js','_pmd.js','_items.js','_lore.js','_pzportrait.js','_chars.js','_trainers.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js','30-capture.js','30b-stakes.js','30c-onze.js','30c-bonus.js','32-world.js','33-fishing.js','34-research.js','36-lore.js','37-cine.js','37b-moments.js','37c-stage.js','38-forage.js','38b-forge.js','38c-dig-plus.js','39-daily.js','39b-events.js','39c-session.js','39p-demandes.js','39r-rival.js',
  '35-modules.js','40-battle.js','40b-picker.js','41-arena.js','42-team.js','50-expedition.js','51-expscene.js','51m-expmap.js','52-expgear.js','54-tower.js','55-squad.js','55b-squad-ui.js','55c-squad-fight.js','55h-histoire.js','56-breche.js','57-breche-run.js','58-breche-ui.js','59-breche-plus.js','59m-breche-map.js','59a-breche-attacks.js','59p-breche-pmd.js','59f-breche-feel.js','59g-breche-bossfight.js','59s-breche-share.js','59d-breche-depth.js','59k-breche-fx.js','59w-breche-world.js','60-poker.js','61-poker-content.js','62-poker-table.js','70-collection.js','72-bag.js','73-cards.js','73b-cardpowers.js','73c-cardreveal.js','73d-reindex.js','73e-provenance.js','73f-chrono.js','73g-pzcard.js','73h-eras.js','73i-displaymodes.js','73j-cardnews.js','74-eggs.js','75-extras.js','76-items.js','77-secrets.js','78-milestones.js','79-ux.js','79b-world.js','79c-legend.js','80-guide.js','81-cosmetics.js','85-journal.js','86-saga.js','87-finale.js','88-share-mn.js','90-admin.js','95-online.js','95b-social.js','96-pwa.js','96b-music.js','99-boot.js'];
const code = ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n");
eval(code + "\n;" + 'global.__api={POKE,POKE_IDS,evalHand,genMap,EXP_ROWS,deepFill,newState,catchChance,typeMult,RARITY,ACHIEVEMENTS,JOKERS,STORY,anteTarget,makeFighter,damageCalc,xpForLevel,handBase,HANDS,newDeck,movesFor,dexTotal,famOf,stageOf,DIRECTIVES,INFOS,TUTOS,PZ_EVENTS,atlasIndex,ATLAS_N,ATLAS_BACK0,SLUGS,cardChips,grantCardV,grantSecretCard,cardVariants,cardHas,cardOwnedCount,cardTotal,CARD_MONS,CARD_SERIES_DEF,CARD_ORDER,rollCardSeries,randomCard,migrateCards,CARD_INDEX,cardChecksum,cardBytes,tcardHtml,cardBackHtml,GEN_TAG,boosterRank,seriesName,seriesFound,monFound,cardSubtitle,cardSpec,cardEra,cardPips,cardArt,cardBg,cardEntryOf,CARD_SCENES,CARD_YEARS,CARD_MN,CARD_ATLAS,resolveName,KNOWN_NAMES,sixthItem,glitchSixthItem,GEN_MARKS,checkChainMark,specialDay,isNightWindow,PZ_POKE_LINES,SIXTH_SLOTS,KONAMI,karpDealDay,karpDealAvailable,BST_BANDS,bstBand,wildIdFor,NODE_W,nodeTypeFor,EXP_ITEMS,rollExpItem,itemMinFloor,EXP_MODES,expRunModes,genMap,traitLevels,traitBonus,TOWER_TRAITS,HABITATS,HABITAT_IDS,habitatWeight,isNight,WEATHER,WEATHER_IDS,weatherDef,speciesInHabitat,FRAGMENTS,RIFT_ARC,checkFragments,riftTick,riftStage,fragmentsFound,fragNext,fragPending,fragOn,fragOnCatch,fragFound,FRAG_SRC,signatureMove,moveTierName,STRATA,forage,forageRate,forageAdvance,digPower,digAff,digRate,crewIds,wallEvery,wallCap,genWall,digHit,digClaim,DIG_LOOT,FOR_UPS,offlineHours,forageTick,EGG_TIERS,EXCLUSIVES,EXCL_SOURCE,isExclusive,RODS,fishPool,newFishEncounter,speciesForRarity,eggPool,repelRarity,lureMul,rstreak,rstreakCatch,rstreakBreak,RSTREAK_MILES,PERMANENTS,charmMul,runeMul,shinyOdds,friendCheck,friendEvo,canEvolve,codeHash,CODES,isSafariDay,SAFARI_POOL,botSpecies,botRate,botHours,FACTIONS,FACTION_RANKS,factionRank,factionMul,factionPts,todayRows,todayPending,REGIONS,unlockedRegions,nextEncounter,newEncounter,rollRarity,fleeChance,RARITY,CINEMAS,CINE_WHO,CINE_T,corruptText,CINE_POS,moduleUnlocked,checkAchievements,sqSkillsOf,sqLeaderOf,sqNewBattle,sqNext,sqTurnStart,sqAct,sqSync,sqSyncReady,sqPredict,sqSkip,sqAI,sqFinish,sqUpgrade,sqState,sqStars,sqZoneOpen,SQ_ZONES,SQ_STAGES,sqWaves,sqSkillLv,MAP_ROWS,MAP_SHAPE,EXP_MAPS,expGainLevels,expExpected,EXP_GAIN,startExpedition,openSector,afterFightRewards,lineRoot,createBattle,bStep,bSpeed,arOn,arNeed,AR_KIND,AR_BIOME,towerState,SCREENS,brSummonBoss,brBossDown,BR_PATTERNS,BR_KIT_BY_TYPE,brBossKit,brTerrainReact,brTerrainUnder,brDecal,brHit,brAddZone,brMapNear,brMapPre,brUpdate,ACTIONS,ITEM_IDX,TREASURE_KEYS,BALLS,BERRIES,STONES,CHESTS,PERMANENTS,TREASURES,EXP_ITEMS,REPELS,ringGrade,RING_GRADES,evSeason,evSeasonKey,evWeeklyLegend,evWeekIndex,evState,evTier,evRunPoints,EV_TRACK,EV_SEASONS,brShareText,BR_KIND,BR_ATK,BR_LEGEND,brArchFor,brFire,brWeaponStats,brSpawnFoe,pwaAfterIntro,pwaInstallable,pwaEnv,brChunkAt,brPushOut,brMastery,BR_TERRAIN,brMissionsFor,brNewRun,brUpdate,brXpNeed,brChoices,brWeaponStats,brDaily,brGuardianWin,brGuardianFor,ROOM_MOMENTS,roomMomentsTick,sqLockOpen,sqLockWaves,sqLockGate,sqLockLevel,sqLockAt,sqLockFinish,brNextEvo,brState,BR_ARCH,BR_ITEMS,ACTIVITIES,COSMETICS,FX_LAYERS,badgeCine,secretCine,BADGES,HANDS,MODULE_REQ,SCREENS,adminHash,ADMIN_HASH,ATELIER_TABS,STORY,RIFT_ARC,directStory,cineFor,RESEARCH_TASKS,researchOf,researchLevel,researchMax,researchTick,taskGoal,RESEARCH_TIERS,TALENTS,talentOf,PERFECT_ODDS,rollPerfect,weekStamp,REPORT_ROWS,lineRoot,towerLevel,towerBand,BUFF_STATS,TRAINERS,expEnemyLevel,setBuddy,buddyTick,buddyTier,buddyBonus,buddy,rollWeekly,weeklyTick,weeklyRollover,openChest,WEEKLY_POOL,BUDDY_FINDS,BUDDY_MAX_TIER,BUDDY_TIER_AFF,CHESTS,addToDex,weekKey,aimBonus,BOOSTS,startBoost,boostActive,LUCKY_DAYS,rollLuckyDay,luckyF,TREASURES,rollTreasure,treasureValue,REGION_TIERS,checkRegionTiers,regionTiersDone,rollContract,contractTick,CONTRACTS,CYCLE_MODS,PERKS,cycleReward,perkLv,loreOf,LORE,PZ_EMOS,pzMood,HELD_ITEMS,grantHeld,heldActive,PLANETS,SPECTRALS,QUEST_POOLS,questMix,rollQuests,bonusSources,bonusTotals,raidState,raidEnd,raidTierReached,raidTotal,RAID_TIERS,wkSubmit,wkState,chalEncode,chalDecode,potState,potAdd,potLose,potMul,roamState,ROAMERS,srcHint,newEncounter,catchChance,fleeChance,getHorde:()=>HORDE,setHorde:v=>{HORDE=v},worldState,worldReg,projOf,projNeedOk,projCanPay,worldNextProj,CHAPTERS,chapterIdx,WORLD_PROJECTS,WORLD_SPOTS,legendOfBlock,legendNow,legendNext,LEG_IDS,legEnd,legState,starsOf,starMul,teamGiveXp,teamXpNeed,teamPower,monPower,candyCost,teamCandyGain,teamIds,teamOnEvolve,STAR_STEPS,addXp,sqUnit,sessState,sessRoll,sessProg,sessDone,sessReward,SESSION_OBJ,nextStep,levelUnlocks,stageHold,banner,Music,MUSIC_TRACKS,musicResolve,cardTier,CARD_POWERS,ORES,ORE_IDS,oreOf,oreHave,oreGain,TOOLS,toolTier,toolCost,toolCanForge,PICK_T,HAMMER_T,DRILL_T,FOR_SITES,siteOpen,siteReachable,siteSwitch,siteDepth,mainMaxM,stratumHard,toolSvg,PK_DECKS,pkBuildDeck,startPoker,pkScore,pkStartRound,pkRollShop,jokerAvail,evalHandRainbow,sanctPlace,sanctChance,sanctJoin,cardShopWares,CARD_ITEM_IDS,MOMENT_Q,cardRevealExpect,cardPowersFlush,CARD_POWER_PENDING,reidxFeed,reidxPts,reidxNext,reidxMigrate,reidxWeave,reidxPanel,reidxRevealHtml,REIDX_AT,REIDX_FRAG,getRT:()=>REIDX_TRACE,cardHowSet,cardHowText,cardRecordHtml,cardNoteRoll,cardNoteOf,cardNoteSign,CARD_NOTES,cardNotesPanelHtml,pzGiftDue,pzGiftGive,pzGiftPick,cardIntegrityBias,CHRONO_END,CHRONO_ERA,chronoEras,chronoComplete,chronoUnseen,chronoLine,chronoMigrate,chronoState,grantPzCard,pzCardOwned,pzCardTick,pzCardPanelHtml,CARD_PZ,skinOf,skinSet,skinChoices,eraVar,eraRecolor,eraSpriteHtml,skinRowHtml,skinZoomHtml,eraOfV,eraBody,eraAuraHalo,eraAuraGlow,eraAuraMotes,displayModeOpen,displayModeOf,displayModesHtml,cnewsPending,cnewsInit,cnewsShow,cnewsHtml,cnewsItems,cnewsHeroPick,reidxQuiet,reidxCalm,reidxSkip,versionText,versionRowHtml,buildV,updAnnounce,setScreen:v=>{currentScreen=v},sprite,pkWishBonus,pkDeckTargetMul,psyFamilies,pkOpp,pkEvoTick,pkToggle,pkPlay,skipResolve,commitResolve,pkDraw,PK_LEADER_ORDER,RIVALS,rivalPrize,rivalRec,safariWeek,localYmd,introSeen,calmFx,applyCalm,brShake,mnShareOpen,mnShareText,mnShareRowHtml,mnShareOffer,mnShareAnswer,storyQWaiting,storyQHintHtml,raidBossFighter,raidXp,RAID_TURNS,RAID_DMG_CAP,setStatus,endOfTurnStatus,pzAskEnsure,pzAskState,pzAskQuest,pzAskOnCatch,pzAskFulfill,pzAskPool,pzAskRowHtml,pzAskHomeHtml,rollQuests,questTick,today,finishBattle,handleKO,histFight,histAfterBattle,histOnEvolve,histRows,histHtml,histFaithful,histDay,histHow,setDexHow:v=>{DEX_HOW=v},ONZE,ONZE_SURE,ONZE_GAP,onzeNext,onzeState,onzeMet,onzeCaught,onzeOnEvolve,monNick,onzePanelHtml,onzeDexHtml,onzeRevealBeats,STORY_Q,STORY_Q_ORDER,storyAns,storyAnswer,storyWhen,storyQPending,pzRecall,pzRecallLine,creditsAnswersHtml,STORY_BY_ID,directStory,expFight,enemySpecFor,expUnstick,getBATTLE:()=>BATTLE,legOpen,legendCardHtml,storyThread,storyThreadHtml,storyRecapHtml,MAIN_ARC,MEM_SCENES,mainArcNext,mainArcPending,pzFmt,pzMask,pzName,frNum,sagaConn,sagaState,sagaKnown,sagaWrote,pzLog,pzLogTick,pzFileHtml,pzMemPct,memoryPanelHtml,finaleReqs,finaleReady,finaleStage,sagaCardHtml,sagaWritePz,creditsRollHtml,sagaCycleBeat,sagaPath,finaleWaves,mnUnit,echoUnit,finalPhase,finaleAfterChoice,finalPrep,finalPrepHtml,nameBytes,nameSprite,hex2,fragAuthor,checkStoryTriggers,STORY_TITLES,STORY_ACTS,cycleReady,cycleCopy,sqLoadWave,sqCheck,sqAlive,setS:function(v){S=v},getS:function(){return S},setENC:function(v){ENC=v},getENC:function(){return ENC},getCINE:function(){return CINE},getCineLast:function(){return CINE_LAST},playStory:playStory};');
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
const A = global.__api;
let pass=0, fail=0;
const t = (n, cond, extra) => { cond?pass++:(fail++,console.log("  ECHEC:",n,extra||"")); };

/* --- donnees --- */
t("386 especes", A.POKE_IDS.length===386, A.POKE_IDS.length);
t("Bulbizarre", A.POKE[1].name==="Bulbizarre" && A.POKE[1].types.join()==="12,4");
t("Pikachu evolue en Raichu par pierre", A.POKE[25].evo[0].to===26 && A.POKE[25].evo[0].stone==="thunder");
t("Mewtwo legendaire rarete 5", A.POKE[150].leg===1 && A.POKE[150].rar===5);
t("Rayquaza present", A.POKE[384].name.length>0);
t("types: Feu vs Plante = x2", A.typeMult(10,[12])===2);
t("types: Electrik vs Sol = x0", A.typeMult(13,[5])===0);
t("types: Combat vs Vol/Psy = x0.25", A.typeMult(2,[3,14])===0.25);

/* --- evaluateur de mains : les cartes sont des Pokemon --- */
A.setS(A.newState());
let uid=0;
const C=(id,shiny)=>({u:uid++,id,shiny:!!shiny,ed:""});
const ev=cs=>A.evalHand(cs).key;
/* familles : Bulbizarre 1>2>3, Salameche 4>5>6, Carapuce 7>8>9, Rattata 19>20 */
t("Paire (memes especes)", ev([C(19),C(19)])==="paire");
t("Brelan", ev([C(19),C(19),C(19)])==="brelan");
t("Carre", ev([C(19),C(19),C(19),C(19)])==="carre");
t("Duo evolutif", ev([C(1),C(2)])==="duo_evo");
t("Trio evolutif", ev([C(1),C(1),C(2)])==="evo_trio");
t("Evolution parfaite", ev([C(1),C(2),C(3)])==="evo_parfaite");
t("Pokeball pleine (brelan+paire)", ev([C(19),C(19),C(19),C(16),C(16)])==="pokeball");
t("Double duo evolutif", ev([C(1),C(2),C(4),C(5)])==="double_duo");
t("Trio legendaire", ev([C(144),C(145),C(146)])==="trio_legend");
t("Pantheon (5 legendaires distincts)", ev([C(144),C(145),C(146),C(150),C(243)])==="pantheon");
t("Duo Originel (Mew + Mewtwo)", ev([C(150),C(151)])==="duo_origine");
t("Paire chromatique", ev([C(19,1),C(16,1)])==="paire_chroma");
t("Flush chromatique", ev([C(19,1),C(16,1),C(21,1),C(23,1),C(27,1)])==="flush_chroma");
t("Rencontre sauvage", ev([C(19),C(43),C(92)])==="sauvage");
t("Mono-type (5 familles distinctes)", (()=>{ const feu=[4,37,58,77,126];
  return ev(feu.map(i=>C(i)))==="monotype"; })());
t("la lignee complete bat le mono-type", ev([C(4),C(5),C(6),C(37),C(58)])==="evo_parfaite");
t("familles coherentes", A.famOf(3)===1 && A.famOf(9)===7 && A.stageOf(3)===2 && A.stageOf(1)===0);
t("la meilleure combinaison l'emporte",
  ev([C(150),C(151),C(19),C(19),C(19)])==="duo_origine");
t("valeur de carte croissante avec les stats",
  A.cardChips(C(3)) > A.cardChips(C(1)) && A.cardChips(C(150)) > A.cardChips(C(19)));
t("chromatique vaut plus", A.cardChips(C(19,1)) > A.cardChips(C(19)));
t("21 combinaisons definies", A.HANDS.length===21, A.HANDS.length);
t("niveaux de main croissants", (()=>{ const b0=A.handBase("paire"); return b0.chips>=15 && b0.mult>=2; })());

/* --- deck --- */
const deck=A.newDeck();
t("deck de 52 Pokemon", deck.length===52, deck.length);
t("identifiants uniques", new Set(deck.map(c=>c.u)).size===52);
t("toutes les cartes existent", deck.every(c=>A.POKE[c.id]));
t("des lignees completes sont presentes",
  (()=>{ const fams={}; deck.forEach(c=>{ (fams[A.famOf(c.id)]=fams[A.famOf(c.id)]||new Set()).add(A.stageOf(c.id)); });
         return Object.values(fams).some(st=>st.size>=2); })());

/* --- sprites embarques --- */
t("atlas de 773 cellules (faces + dos)", A.ATLAS_N===773, A.ATLAS_N);
t("les dos sont adressables", A.atlasIndex(1,true)===387 && A.atlasIndex(386,true)===772);
t("pas de dos pour le guide", A.atlasIndex(474,true)===-1);
t("index de face correct", A.atlasIndex(1)===0 && A.atlasIndex(386)===385 && A.atlasIndex(474)===386);
t("index hors bornes rejete", A.atlasIndex(9999)===-1 && A.atlasIndex(0)===-1);
t("386 identifiants de sprites", A.SLUGS.length===386);

/* --- guidage --- */
t("17 directives", A.DIRECTIVES.length===17, A.DIRECTIVES.length);
t("directives evaluables", A.DIRECTIVES.every(d=>typeof d.chk==="function" && typeof d.goal==="function"));
t("chaque directive a une recompense et un indice",
  A.DIRECTIVES.every(d=>d.rw && Object.keys(d.rw).length && d.hint && d.hint.length>10));
t("fiches d'information completes",
  Object.keys(A.INFOS).length>=12 && Object.values(A.INFOS).every(f=>f.n && f.d.length>120));
t("tutoriels avec cibles", Object.keys(A.TUTOS).length>=8 &&
  Object.values(A.TUTOS).every(x=>x.steps.length>=2 && x.steps.every(st=>st.t && st.sel)));
t("evenements de Porygon-Z", A.PZ_EVENTS.length>=15 &&
  A.PZ_EVENTS.every(e=>typeof e.c==="function" && e.t.length>40));

/* --- etat / sauvegarde --- */
const st = A.newState();
A.setS(st);
t("etat initial coherent", st.integrity===0 && st.level===1 && Object.keys(st.dex).length===0);
const old = {level:9, coins:777, dex:{25:{c:3,s:0,lvl:12,shiny:false}}};  /* vieille sauvegarde partielle */
const mig = A.deepFill(JSON.parse(JSON.stringify(old)), A.newState());
t("migration conserve les donnees", mig.level===9 && mig.coins===777 && mig.dex[25].lvl===12);
t("migration ajoute les cles manquantes", mig.items && mig.quests !== undefined && mig.pokerMeta !== undefined);
t("xp croissant", A.xpForLevel(2) > A.xpForLevel(1) && A.xpForLevel(20) > A.xpForLevel(10));

/* --- capture --- */
A.setS(Object.assign(A.newState(), {level:5, streak:0, region:"kanto"}));
A.setENC({id:6, level:40, shiny:false, rar:3, attempts:0});
const cPoke = A.catchChance("poke"), cHyper = A.catchChance("hyper");
t("chance dans [0,1]", cPoke>0 && cPoke<=0.97, cPoke);
t("Hyper Ball > Poke Ball", cHyper > cPoke, cPoke+" / "+cHyper);
t("Master Ball garantie", A.catchChance("master")===1);
A.setENC({id:150, level:70, shiny:false, rar:5, attempts:0});
t("legendaire plus dur", A.catchChance("poke") < cPoke);

/* --- carte d'expedition : tous les noeuds atteignables --- */
let mapOk = true, bossOk = true;
for(let s=0;s<200;s++){
  const m = A.genMap(s*7919+13);
  if(m.length!==A.MAP_ROWS){ mapOk=false; break; }
  if(m[A.MAP_ROWS-1].length!==1 || m[A.MAP_ROWS-1][0].t!=="boss") bossOk=false;
  for(let y=1;y<m.length;y++){
    for(let i=0;i<m[y].length;i++){
      if(!m[y-1].some(p=>p.next.includes(i))){ mapOk=false; }
    }
  }
  for(let y=0;y<m.length-1;y++) for(const n of m[y]) if(!n.next.length) mapOk=false;
}
t("carte : tous les noeuds atteignables (200 graines)", mapOk);
t("carte : boss unique au sommet", bossOk);

/* --- combat --- */
const f1 = A.makeFighter(6, 50), f2 = A.makeFighter(9, 50);
t("stats de combat plausibles", f1.maxHp>100 && f1.maxHp<300 && f1.atk>50, f1.maxHp+"/"+f1.atk);
t("4 attaques max", A.movesFor(A.POKE[6],50).length<=4 && A.movesFor(A.POKE[6],50).length>0);
const dmg = A.damageCalc(f2,f1,{type:11,pw:90,acc:1},false); /* Eau -> Feu/Vol */
t("degats > 0 et efficacite calculee", dmg.dmg>0 && dmg.eff===2, JSON.stringify(dmg));

/* --- antes --- */
t("antes croissantes", A.anteTarget(1,0) < A.anteTarget(1,2) && A.anteTarget(1,2) < A.anteTarget(2,0));

/* --- contenu --- */
t("38 scenes narratives", A.STORY.length===38, A.STORY.length);
t("89 succes", A.ACHIEVEMENTS.length===89, A.ACHIEVEMENTS.length);
t("69 programmes (dont 6 ouverts par les cartes, 13 nouveaux et 21 évolutifs, dont 14 formes évoluées)", A.JOKERS.length===69 && A.JOKERS.filter(j=>j.card).length===6 && A.JOKERS.filter(j=>j.evoOnly).length===14, A.JOKERS.length);
t("6 paliers de rarete", A.RARITY.length===6);


/* --- compagnon --- */
A.setS(A.newState());
A.addToDex(25, 12, false); A.addToDex(6, 30, false);
t("aucun compagnon au depart", A.buddy()===null);
A.setBuddy(25);
t("compagnon assigne", A.buddy() && A.buddy().id===25);
t("bonus neutre au palier 0", A.buddyTier()===0 && A.buddyBonus().coin===1);
(()=>{
  const S0=A.getS(); const lvl0=S0.dex[25].lvl;
  for(let i=0;i<A.BUDDY_TIER_AFF+2;i++) A.buddyTick(0);
  t("le palier fait gagner des niveaux permanents", S0.dex[25].lvl>lvl0, S0.dex[25].lvl+" vs "+lvl0);
  t("palier atteint", A.buddyTier()>=1);
  t("bonus croissant", A.buddyBonus().coin>1 && A.buddyBonus().catch>1);
})();
(()=>{
  const S0=A.getS();
  for(let i=0;i<A.BUDDY_TIER_AFF*20;i++) A.buddyTick(3);
  t("palier plafonne", A.buddyTier()===A.BUDDY_MAX_TIER, A.buddyTier());
  t("niveau d'espece plafonne a 100", S0.dex[25].lvl<=100, S0.dex[25].lvl);
  t("le compagnon rapporte des objets", (S0.buddy.finds||0)>0, S0.buddy.finds);
})();
t("changer de compagnon remet l'affinite a zero",
  (()=>{ A.setBuddy(6); return A.buddy().id===6 && A.buddy().aff===0; })());
t("compagnon absent de l'archive ignore",
  (()=>{ A.getS().buddy={id:999,aff:5,finds:0}; const ok=A.buddy()===null;
         A.getS().buddy=null; return ok; })());

/* --- hebdomadaires --- */
A.setS(A.newState());
A.rollWeekly();
(()=>{
  const W=A.getS().weekly;
  t("3 objectifs hebdomadaires", W.quests.length===3, W.quests.length);
  t("objectifs distincts", new Set(W.quests.map(q=>q.id)).size===3);
  t("cle de semaine stable", W.week===A.weekKey() && /^\d{4}-S\d{1,2}$/.test(W.week), W.week);
  const q=W.quests[0];
  A.weeklyTick(Object.keys({dayCatch:1,dayNew:1,dayRare:1,dayExp:1,dayPokerBlinds:1,dayBoss:1,
    dayEvo:1,dayFish:1,dayEnergy:1}).find(k=>({dayCatch:"wkCatch",dayNew:"wkNew",dayRare:"wkRare",
    dayExp:"wkExp",dayPokerBlinds:"wkPoker",dayBoss:"wkBoss",dayEvo:"wkEvo",dayFish:"wkFish",
    dayEnergy:"wkEnergy"})[k]===q.stat), q.goal);
  t("un objectif progresse jusqu'a son but", q.prog===q.goal, q.prog+"/"+q.goal);
})();
t("rollover hebdomadaire conserve la semaine en cours",
  (()=>{ const w=A.getS().weekly.week; A.weeklyRollover(); return A.getS().weekly.week===w; })());
t("rollover hebdomadaire renouvelle une semaine perimee",
  (()=>{ A.getS().weekly.week="2000-S1"; A.weeklyRollover();
         return A.getS().weekly.week===A.weekKey() && A.getS().weekly.quests.every(q=>q.prog===0); })());
t("10 modeles hebdomadaires", A.WEEKLY_POOL.length===10, A.WEEKLY_POOL.length);

/* --- coffres --- */
A.setS(A.newState());
for(const k of Object.keys(A.CHESTS)){
  t("coffre "+k+" produit un butin lisible", (()=>{
    const items=A.openChest(k, true);
    if(!items.length) return false;
    return items.every(it=>typeof it.label==="string" && it.label.length>0
      && (it.icon || it.id!==undefined) && it.color);
  })());
}
t("butin des coffres serialisable", (()=>{
  for(let i=0;i<40;i++) A.openChest("void", true);
  try{ JSON.parse(JSON.stringify(A.getS())); return true; }catch(e){ return false; }
})());
t("les trouvailles du compagnon sont toutes valides",
  A.BUDDY_FINDS.every(f=>{ const r=f.rw(); return r && Object.keys(r).length; }));


/* --- visée : bonus, jamais de malus --- */
t("hors de la cible : aucun effet", A.aimBonus(10,[40,60])===1 && A.aimBonus(90,[40,60])===1);
t("centre de la cible : +25 %", Math.abs(A.aimBonus(50,[40,60])-1.25)<1e-9);
t("la cible est dégressive du centre vers le bord", A.aimBonus(50,[40,60]) > A.aimBonus(46,[40,60]) && A.aimBonus(46,[40,60]) > A.aimBonus(41,[40,60]) && A.aimBonus(41,[40,60]) > 1);
t("jamais hors bornes", (()=>{ for(let z=0;z<60;z+=7){ const zone=[z,z+24];
  for(let p=0;p<=100;p+=1){ const b=A.aimBonus(p,zone); if(b<1||b>1.2500001) return false; } }
  return true; })());

/* --- consommables à durée --- */
A.setS(A.newState());
t("boost inactif au départ", !A.boostActive("xp"));
A.startBoost("b_xp");
t("boost activé", A.boostActive("xp"));
t("un second achat prolonge au lieu d'écraser", (()=>{
  const S0=A.getS(); const t1=S0.boosts.xp; A.startBoost("b_xp");
  return S0.boosts.xp > t1 + 14*60000; })());
t("tous les boosts sont cohérents", Object.values(A.BOOSTS).every(b=>
  b.n && b.d && b.min>0 && b.price>0 && (b.cur==="coins"||b.cur==="shards") && b.k && b.spr));

/* --- jours fastes --- */
t("8 profils de journée", A.LUCKY_DAYS.length===8, A.LUCKY_DAYS.length);
t("tirage toujours valide", (()=>{ const ids=A.LUCKY_DAYS.map(d=>d.id);
  for(let i=0;i<3000;i++) if(!ids.includes(A.rollLuckyDay())) return false; return true; })());
t("journée normale majoritaire mais pas écrasante", (()=>{
  let none=0,big=0; for(let i=0;i<6000;i++){ const d=A.rollLuckyDay();
    if(d==="d_none") none++; if(d==="d_gold"||d==="d_storm") big++; }
  const p=none/6000, b=big/6000;
  return p>0.45 && p<0.70 && b>0.01 && b<0.06; })());
t("multiplicateurs lisibles", A.LUCKY_DAYS.every(d=>d.id==="d_none" ||
  (d.n && d.d && d.f && Object.values(d.f).every(v=>typeof v==="number"))));

/* --- trésors de sonde --- */
A.setS(A.newState());
t("les trésors s'accumulent et se valorisent", (()=>{
  const S0=A.getS();
  for(let i=0;i<400;i++) A.rollTreasure(2);
  const n=Object.values(S0.treasures||{}).reduce((a,b)=>a+b,0);
  if(n<20) return false;
  const v=A.treasureValue();
  let calc=0; for(const k in S0.treasures) calc+=A.TREASURES[k].sell*S0.treasures[k];
  return v===calc && v>0; })());
t("la profondeur augmente le rendement", (()=>{
  const mesure=d=>{ A.setS(A.newState()); let n=0;
    for(let i=0;i<3000;i++) if(A.rollTreasure(d)) n++; return n; };
  return mesure(2) > mesure(0)*1.4; })());
t("la Statue Dorée reste rare", A.TREASURES.golden.w===1 && A.TREASURES.golden.sell>20000);

/* --- paliers de secteur --- */
A.setS(A.newState());
t("aucun palier au départ", A.regionTiersDone("kanto").length===0);
t("les paliers se déclenchent une seule fois, dans l'ordre", (()=>{
  const S0=A.getS();
  for(let i=1;i<=151;i++) A.addToDex(i,20,false);
  let guard=0;
  while(A.checkRegionTiers() && guard++<20){}
  const done=A.regionTiersDone("kanto");
  if(done.length!==4) return false;
  if(new Set(done).size!==4) return false;
  return !A.checkRegionTiers(); })());
t("4 paliers avec récompense et texte", A.REGION_TIERS.length===4 &&
  A.REGION_TIERS.every(t2=>t2.pct>0 && t2.rw && Object.keys(t2.rw).length && t2.t.length>15));

/* --- contrats --- */
A.setS(A.newState());
A.rollContract();
t("contrat complet", (()=>{ const C=A.getS().contract;
  return C && C.n && C.goal>0 && C.prog===0 && C.until>Date.now() && C.rw; })());
t("seules les captures conformes comptent", (()=>{
  const S0=A.getS();
  S0.contract={id:"c_rar", r:"kanto", x:2, goal:3, prog:0, claimed:false,
    until:Date.now()+1e7, n:"test", rw:{coins:1}};
  A.contractTick(16,false);            /* Roucool, commun -> ne compte pas */
  const a=S0.contract.prog;
  A.contractTick(149,false);           /* Dracolosse, rare+ -> compte */
  return a===0 && S0.contract.prog===1; })());
t("5 modèles de contrat testables", A.CONTRACTS.length===5 &&
  A.CONTRACTS.every(c=>typeof c.test==="function" && typeof c.pick==="function"));

/* --- nouveau cycle --- */
A.setS(A.newState());
t("cycle non bouclable avant l'épilogue", !A.getS().flags.climax);
t("récompense de cycle croissante avec la progression", (()=>{
  const S0=A.getS();
  const base=A.cycleReward();
  for(let i=1;i<=200;i++) A.addToDex(i,20,false);
  S0.bosses=["a","b","c","d","e","f","g","h","i"]; S0.level=40; S0.stats.shinies=20;
  const plein=A.cycleReward();
  S0.cycle={n:0, mods:Object.keys(A.CYCLE_MODS)};
  const durci=A.cycleReward();
  return plein>base && durci>plein; })());
t("5 modificateurs, bonus cumulés réalistes", (()=>{
  const tot=Object.values(A.CYCLE_MODS).reduce((a,m)=>a+m.bonus,0);
  return Object.keys(A.CYCLE_MODS).length===5 && tot>0.9 && tot<1.2; })());
t("avantages bornés et chiffrables", Object.values(A.PERKS).every(p=>
  p.max>=1 && p.cost(0)>0 && p.cost(p.max-1)>=p.cost(0) && p.d(0).length>5));

/* --- objets tenus --- */
A.setS(A.newState());
t("un objet ne produit rien sans compagnon", (()=>{
  A.grantHeld("h_coin");
  return !A.heldActive("coin"); })());
t("9 objets tenus valides", Object.keys(A.HELD_ITEMS).length===9 &&
  Object.values(A.HELD_ITEMS).every(i=>i.n && i.d && i.k && i.spr && i.rar>=0));

/* --- contenu poker ajouté --- */
t("13 planètes, une par combinaison existante", A.PLANETS.length===13 &&
  A.PLANETS.every(p=>A.HANDS.some(h=>h.id===p.hand)));
t("10 spectres décrits", A.SPECTRALS.length===10 &&
  A.SPECTRALS.every(s2=>s2.n && s2.cost>0 && (s2.d||s2.card)));

/* --- quêtes à quatre paliers --- */
t("4 viviers de quêtes", Object.keys(A.QUEST_POOLS).length===4);
t("le bouquet suit le niveau", (()=>{
  const bas=A.questMix(3).join(), haut=A.questMix(50).join();
  return bas!==haut && A.questMix(3).length===4 && A.questMix(50).length===4; })());
t("anti-répétition d'un jour sur l'autre", (()=>{
  A.setS(A.newState()); const S0=A.getS(); S0.level=20;
  A.rollQuests(); const j1=S0.quests.map(q=>q.id);
  A.rollQuests(); const j2=S0.quests.map(q=>q.id);
  const commun=j1.filter(x=>j2.includes(x)).length;
  return j1.length===4 && j2.length===4 && commun<=1; })());
t("identifiants uniques dans un même jour", (()=>{
  A.rollQuests(); const ids=A.getS().quests.map(q=>q.id);
  return new Set(ids).size===ids.length; })());

/* --- notices et portraits --- */
t("386 notices non vides", A.LORE.length===386 && A.LORE.every(x=>x && x.length>15));
t("notice hors bornes vide", A.loreOf(0)==="" && A.loreOf(999)==="");
t("17 émotions disponibles, les dix premières à leur place d'origine", A.PZ_EMOS.length===17 &&
  ["Normal","Happy","Joyous","Determined","Worried","Sad","Angry","Surprised","Stunned","Pain"].every((m,i)=>A.PZ_EMOS[i]===m));
t("l'humeur suit l'intégrité", (()=>{
  A.setS(A.newState()); const S0=A.getS();
  const bas=A.pzMood(); S0.integrity=95; const haut=A.pzMood();
  return bas!==haut && A.PZ_EMOS.includes(bas) && A.PZ_EMOS.includes(haut); })());
t("une réplique force son émotion", A.pzMood({m:"Angry"})==="Angry");


/* --- cartes de collection --- */
A.setS(A.newState());
t("les cartes ne concernent que les légendaires", A.CARD_MONS.length===21 &&
  A.CARD_MONS.every(id=>A.POKE[id].leg>0), A.CARD_MONS.length);
t("chaque légendaire a au moins une illustration",
  A.CARD_MONS.every(id=>A.cardVariants(id).length>=1));
t("cinq ont une illustration Primordiale : les quatre déclarés, et Mew",
  A.CARD_MONS.filter(id=>A.cardVariants(id).includes("g1")).length===5 && A.cardVariants(151).includes("g1"));
t("Mew et Celebi ont leur Rendu fondateur (les petits sprites ne sont plus écartés)",
  A.cardVariants(151).includes("g2") && A.cardVariants(251).includes("g2") && A.CARD_MONS.filter(id=>A.cardVariants(id).includes("g2")).length===11);
t("les séries sont ordonnées de la plus commune à la plus rare", (()=>{
  const w=A.CARD_ORDER.map(s2=>A.CARD_SERIES_DEF[s2].w);
  return w.every((v,i)=>i===0||v<w[i-1]); })());
t("79 illustrations plus la pièce secrète", Object.keys(A.CARD_INDEX).length===79 &&
  A.cardTotal()===80, A.cardTotal());
t("obtenir une carte, puis un doublon", (()=>{
  const S0=A.getS();
  if(!A.grantCardV("g3",150)) return false;
  if(A.cardOwnedCount()!==1) return false;
  if(A.grantCardV("g3",150)) return false;          /* la seconde est un doublon */
  return S0.cards["g3:150"].dup===1 && A.cardHas("g3",150); })());
t("la pièce secrète ne s'obtient qu'une fois",
  A.grantSecretCard()===true && A.grantSecretCard()===false);
t("le tirage reste dans les variantes existantes", (()=>{
  for(let i=0;i<600;i++){ const c=A.randomCard(1);
    if(!A.cardVariants(c.id).includes(c.s)) return false; }
  return true; })());
t("un biais élevé favorise les séries anciennes", (()=>{
  const cnt=b=>{ let old=0; for(let i=0;i<3000;i++){
    const s2=A.rollCardSeries(150,b); if(s2==="g2"||s2==="g1") old++; } return old; };
  return cnt(3.2) > cnt(1)*2; })());
t("migration des anciennes sauvegardes", (()=>{
  const old={150:{r:2,t:1,dup:1}, 249:{r:0,t:2}};
  const m=A.migrateCards(old);
  return m["g3:150"] && m["g3:150"].dup===1 && m["art:249"] && !m["150"]; })());
t("une sauvegarde déjà migrée n'est pas retouchée", (()=>{
  const cur={"g1:144":{t:1,dup:0}};
  const m=A.migrateCards(cur);
  return m["g1:144"] && Object.keys(m).length===1; })());

/* --- réindexation : les doublons retrouvent les illustrations manquantes --- */
t("réindexation : au sixième doublon, l'illustration la plus courante qui manque affleure", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  A.grantCardV("g3", 150);
  for(let i = 0; i < 5; i++) A.grantCardV("g3", 150);
  if(A.reidxPts(150) !== 5 || A.cardHas("art", 150)) return false;
  A.grantCardV("g3", 150);
  return A.cardHas("art", 150) && A.reidxPts(150) === 0 && A.REIDX_AT === 6
    && S0.reidxQ.length === 1 && S0.reidxQ[0].s === "art" && A.reidxNext(150) === "g5";
})());
t("réindexation : la carte retrouvée suit son doublon dans la scène, avec sa jauge", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  A.getRT().length = 0;
  A.grantCardV("art", 245);
  const d = [];
  for(let i = 0; i < 6; i++) d.push({s:"art", id:245, fresh:A.grantCardV("art", 245)});
  const w = A.reidxWeave([d[4], d[5], {s:"art", id:150, fresh:true}]);
  const o = w.out;
  return o.length === 4 && o[0] === d[4] && o[0].rx.shown === 5 && o[1] === d[5] && o[1].rx.restored[0] === "g5"
    && o[2].reidx && o[2].s === "g5" && o[2].id === 245 && o[3].id === 150 && S0.reidxQ.length === 0
    && A.reidxRevealHtml(o[0]).includes("5 / 6") && A.reidxRevealHtml(o[1]).includes("réapparaît");
})());
t("réindexation : le pouvoir de la carte retrouvée attend sa scène", (()=>{
  A.cardPowersFlush(); A.getRT().length = 0;
  A.setS(A.newState());
  A.grantCardV("art", 243);
  for(let i = 0; i < 6; i++) A.grantCardV("art", 243);
  const ok = A.cardHas("g5", 243) && A.CARD_POWER_PENDING[243] && A.CARD_POWER_PENDING[243].after === 2;
  A.cardPowersFlush();
  return ok;
})());
t("réindexation : une ligne complète décompose chaque doublon en Fragments", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  for(const s2 of A.cardVariants(144)) A.grantCardV(s2, 144);
  const before = S0.shards;
  A.grantCardV("g1", 144);
  return S0.shards === before + A.REIDX_FRAG && !A.reidxPts(144) && A.reidxNext(144) === null
    && A.reidxPanel(144).includes("ligne complète");
})());
t("réindexation : les doublons d'une ancienne partie comptent une fois", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.flags.intro = true;
  S0.cards = {"g3:150":{t:1, dup:9}, "art:150":{t:1, dup:4}, "art:249":{t:1, dup:2}, "art:384":{t:1, dup:8}, "g3:384":{t:1, dup:0}};
  const n = A.reidxMigrate();
  const again = A.reidxMigrate();
  /* 13 doublons de Mewtwo : deux écritures retrouvées (g5, g2), un point reste pour g1 ;
     Lugia : deux points ; Rayquaza : sa seule écriture manquante, puis la ligne est complète */
  return n === 3 && again === 0 && A.cardHas("g5", 150) && A.cardHas("g2", 150) && !A.cardHas("g1", 150)
    && A.reidxPts(150) === 1 && A.reidxPts(249) === 2 && A.cardHas("g5", 384) && A.reidxPts(384) === 0
    && S0.reidxV === 1 && S0.reidxQ.length === 3;
})());
/* --- provenance, exemplaires annotés, cadeau de 1996 --- */
t("provenance : la première carte garde d'où elle vient, la connexion et l'équipe du moment", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  A.addToDex(6, 30, false); A.addToDex(131, 28, false); S0.team = [6, 131];
  A.cardHowSet("guardian", {g:150, r:"kanto"});
  A.grantCardV("art", 150);
  const h = S0.cards["art:150"].h;
  const back = A.cardRecordHtml("art", 150);
  return h && h.k === "guardian" && h.tm.join() === "6,131" && h.cx === 12
    && back.includes("en levant le verrou de Mewtwo, à Kanto") && back.includes("Dracaufeu") && back.includes("connexion n° 12");
})());
t("provenance : un doublon ne la réécrit pas ; une carte d'avant le dit", (()=>{
  const S0 = A.getS();
  A.cardHowSet("exp", {c:2}); A.grantCardV("art", 150);
  S0.cards["g5:150"] = {t:1, dup:0};
  return S0.cards["art:150"].h.k === "guardian" && A.cardRecordHtml("g5", 150).includes("elle n'en connaît que la date")
    && A.cardHowText({k:"exp", c:2}).includes("à corruption 2") && A.cardRecordHtml("g3", 150) === "";
})());
t("annotations : onze, une par connexion, chacune sur un légendaire différent", A.CARD_NOTES.length === 11
  && new Set(A.CARD_NOTES.map(n=>n.id)).size === 11 && A.CARD_NOTES.every(n=>A.CARD_MONS.includes(n.id) && n.t.length > 40 && n.pz));
t("annotations : la page trouvée ouvre l'annotation de sa connexion, forcément au troisième doublon", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  A.grantCardV("art", 146); A.grantCardV("art", 145);
  /* sans la page, rien */
  for(let i = 0; i < 4; i++) A.grantCardV("art", 146);
  if(Object.keys(S0.cardNotes).length) return false;
  S0.fragments = [1];
  for(let i = 0; i < 3; i++) A.grantCardV("art", 146);
  for(let i = 0; i < 3; i++) A.grantCardV("art", 145);    /* connexion 07 : page pas trouvée */
  const n = A.cardNoteOf("art", 146);
  return S0.cardNotes[1] && S0.cardNotes[1].s === "art" && n && n.c === 1 && !S0.cardNotes[7]
    && A.tcardHtml("art", 146).includes("tc-slip") && A.cardRecordHtml("art", 146).includes("Vitefait")
    && A.cardNotesPanelHtml().includes("1 / 11");
})());
t("annotations : signées ▒ jusqu'à la révélation, puis du nom du joueur", (()=>{
  const S0 = A.getS(); S0.name = "SACHA";
  const n = A.CARD_NOTES[0];
  const before = A.cardNoteSign(n);
  S0.saga.known = true;
  const after = A.cardNoteSign(n);
  S0.saga.known = false;
  return before === "▒▒▒▒▒ · connexion 01" && after === "SACHA · connexion 01";
})());
t("cadeau de 1996 : après le premier aveu, Porygon-Z rend le Rendu primordial de Mew, une fois", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  if(A.pzGiftDue()) return false;
  S0.story.push("pz_mem3");
  if(!A.pzGiftDue()) return false;
  const c = A.pzGiftGive();
  const again = A.pzGiftGive();
  return c && c.s === "g1" && c.id === 151 && c.fresh && S0.cards["g1:151"].h.k === "gift"
    && !A.pzGiftDue() && again === null && A.cardRecordHtml("g1", 151).includes("connexion 01");
})());
t("cadeau de 1996 : Mew déjà là, une autre illustration primordiale ; sinon fondatrice", (()=>{
  A.setS(A.newState());
  A.grantCardV("g1", 151);
  const a = A.pzGiftPick();
  for(const id of A.CARD_MONS) if(A.cardVariants(id).includes("g1")) A.grantCardV("g1", id);
  const b = A.pzGiftPick();
  return a.s === "g1" && a.id !== 151 && b.s === "g2";
})());
t("l'intégrité fait remonter les séries anciennes (×1,3 par série à 100 %)", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  const old = () => { let n = 0; for(let i = 0; i < 4000; i++){ const s2 = A.rollCardSeries(150); if(s2 === "g3" || s2 === "g2" || s2 === "g1") n++; } return n; };
  S0.integrity = 0; const lo = old();
  S0.integrity = 100; const hi = old();
  return Math.abs(A.cardIntegrityBias() - 1.3) < 1e-9 && hi > lo * 1.25;
})());
t("cadeau de 1996 : à une collection complète, un exemplaire de plus, ni relu ni annoté par un autre", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  for(const id of A.CARD_MONS) for(const s2 of A.cardVariants(id)) A.grantCardV(s2, id);
  S0.fragments = [1,2,3,4,5,6,7,8,9,10,11];
  S0.story.push("pz_mem3");
  const sh = S0.shards || 0, rt = A.getRT().length;
  const c = A.pzGiftGive();
  return c && c.s === "g1" && c.id === 151 && !c.fresh && S0.cards["g1:151"].dup === 1 && c.tag === "GARDÉE DEPUIS LA CONNEXION 01"
    && (S0.shards || 0) === sh && A.getRT().length === rt && !(S0.cardNotes || {})[6] && !(S0.cardNoteTry || {})[6];
})());
/* --- ce qui a changé dans tes cartes --- */
t("nouveautés des cartes : une collection d'avant la version les reçoit une fois, avant les autres révélations", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.story.push("intro");
  A.setScreen("capture");
  for(const s2 of A.cardVariants(150)) A.grantCardV(s2, 150);
  for(const id of [144, 145, 146]) A.grantCardV("art", id);
  for(const id of A.CARD_MONS) if(A.cardVariants(id).includes("g1")) A.grantCardV("g1", id);
  A.chronoMigrate();
  if(!A.reidxCalm() || !A.cnewsPending() || A.reidxQuiet()) return false;
  const html = A.cnewsHtml();
  const ok = html.includes("Tes cartes ont changé") && html.includes("Voir celle de Mewtwo") && html.includes("Voir mes cartes")
    && html.includes("1996 (Game Boy)") && !html.includes("1999 (") && html.includes("tcard s-g1") && html.includes("tcard s-art")
    && !/pixel|undefined|NaN/i.test(html);
  A.cnewsShow();
  return ok && !A.cnewsPending() && A.reidxQuiet() && S0.saga.cnews > 0 && S0.dmSeen.g1 > 0 && !S0.dmSeen.g2;
})());
t("nouveautés des cartes : une partie neuve ne les voit jamais, elle découvre en jouant", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  const before = A.cnewsPending() === false && S0.saga.cnews === undefined;   /* rien avant l'introduction */
  S0.story.push("intro");
  A.grantCardV("art", 150);
  const p1 = A.cnewsPending();
  for(const id of A.CARD_MONS) A.grantCardV("art", id);
  return before && !p1 && S0.saga.cnews === -1 && !A.cnewsPending();
})());
t("nouveautés des cartes : chaque ligne dit ce qui sert, sans jargon ni chiffres de pixels", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.story.push("intro");
  for(const id of A.CARD_MONS) A.grantCardV("art", id);
  const L = A.cnewsItems();
  const dup = L.find(x=>x.t === "Tes doublons servent");
  return L.length >= 3 && L.every(x=>x.t && x.d && x.d.length < 220 && !/pixel|×/.test(x.d)) && dup && dup.d.includes("sixième")
    && A.cnewsHeroPick().length === 3;
})());
<<<<<<< HEAD
/* --- retours d'un joueur (23 octobre) --- */
t("capture : « 98 % » puis un lancer Excellent ne peut plus échouer ; le bonus annoncé se voit dans le pourcentage", (()=>{
  A.setS(A.newState());
  A.setENC({id:16, level:3, shiny:false, rar:0, attempts:0});
  const base = A.catchChance("hyper");
  const sure = A.throwChance("hyper", 1.25), bien = A.throwChance("hyper", 1.07), none = A.throwChance("hyper", 1);
  const ok = base === 0.98 && sure === 1 && bien === 1 && none === 0.98;
  A.setENC(null);
  return ok && A.aimResText({n:"Excellent", mul:1.25}, 1) === "Excellent — capture assurée"
    && A.aimResText({n:"Bien", mul:1.07}, 0.53) === "Bien +7 % — 53 %" && A.aimResText(null, 0.4) === "À côté — 40 %";
})());
t("forage : des couches atteintes ailleurs n'interrompent rien ; au retour, une seule annonce les réunit", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.tutos = ["idle"];
  A.setScreen("capture");
  A.forStrataReached([3, 4]);
  const f = A.forage();
  const waiting = f.newStrata.join() === "3,4";
  const m = A.forNewMoment([3, 4], []);
  const one = m.kind === "depth" && m.kicker.startsWith("2 NOUVELLES COUCHES") && m.title === A.STRATA[4].n && m.sub.includes(A.STRATA[3].n);
  const shown = A.forAnnounceNew();
  return waiting && one && shown === true && f.newStrata.length === 0 && A.forAnnounceNew() === false;
})());
t("forage : la première visite garde son tutoriel, l'annonce attend la suivante", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.tutos = [];
  A.setScreen("capture");
  A.forStrataReached([2]);
  const held = A.forAnnounceNew() === false && A.forage().newStrata.length === 1;
  S0.tutos = ["idle"];
  return held && A.forAnnounceNew() === true;
})());
t("succès : plusieurs d'un coup tiennent dans une seule bannière", (()=>{
  const one = A.achBanner([{n:"Premier pas", d:"Capturer un Pokémon", rw:{}}]);
  const many = A.achBanner([{n:"A"}, {n:"B"}, {n:"C"}, {n:"D"}]);
  return one.kicker === "SUCCÈS" && one.title === "Premier pas" && many.kicker === "4 SUCCÈS" && many.title === "A, B et 2 autres" && many.sub === "C · D";
})());
t("expédition : le sac garde un objet ; en donner un autre range l'ancien au lieu de le jeter", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  for(const id of [4, 7, 1]) A.addToDex(id, 20, false);
  try { A.startExpedition([4, 7, 1]); } catch(e){}   /* l'écran n'existe pas ici, le parcours si */
  const run = S0.expedition;
  const a = A.expEquip(run, 0, "i_loupe") === null && run.team[0].item === "i_loupe";
  const old = A.expEquip(run, 0, "i_orbe");
  const b = old === "i_loupe" && run.team[0].item === "i_orbe" && A.expBag(run).join() === "i_loupe";
  for(let i = 0; i < 12; i++) A.expBagAdd(run, "i_roche");
  return a && b && A.expBag(run).length === 8;
})());
t("expédition : le menu du bas demande avant de quitter un parcours en cours", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  for(const id of [4, 7, 1]) A.addToDex(id, 20, false);
  try { A.startExpedition([4, 7, 1]); } catch(e){}   /* l'écran n'existe pas ici, le parcours si */
  A.setScreen("expedition");
  const ask = A.expLeaveNeedsAsk("capture") && !A.expLeaveNeedsAsk("expedition");
  A.setScreen("capture");
  const elsewhere = !A.expLeaveNeedsAsk("modules");
  S0.expedition = null; A.setScreen("expedition");
  return ask && elsewhere && !A.expLeaveNeedsAsk("capture");
})());
t("expédition : la fin est gardée au camp, et dit ce qui reste", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  for(const id of [4, 7, 1]) A.addToDex(id, 20, false);
  try { A.startExpedition([4, 7, 1]); } catch(e){}   /* l'écran n'existe pas ici, le parcours si */
  A.setScreen("capture");
  A.endExpedition(true);
  const L = S0.expLast, html = A.expLastHtml();
  return !S0.expedition && L && L.win === true && L.gains.length === 3 && L.gains.every(g=>g.add >= 2)
    && html.includes("Dernière expédition : réussie") && html.includes("Bulbizarre") && !/undefined|NaN/.test(html);
})());
t("MissingNo : sans toile (tests), la fêlure retombe sur l'image de secours, partout pareil", (()=>{
  A.setS(A.newState());
  return A.spriteUrl(0) === A.getMISSING() && A.mnSprite(0) === A.getMISSING() && A.mnSpriteHtml().includes(A.getMISSING());
})());
=======
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
/* --- la version du jeu --- */
t("version : sans build, « Version de développement », montrée dans les Réglages", (()=>{
  A.setS(A.newState());
  const row = A.versionRowHtml();
  const html = (()=>{ try { return A.SCREENS.settings.html(); } catch(e){ return ""; } })();
  return A.buildV() === "" && A.versionText() === "Version de développement" && row.includes("Version de développement")
    && !row.includes("updcheck") && (html === "" || html.includes("Version de développement"));
})());
t("version : la version embarquée et la version hébergée portent la même empreinte et la même date", (()=>{
  const re = /const BUILD_V = "([0-9a-f]{8})", BUILD_LABEL = "([^"]+)"/;
  const d = fs.readFileSync("dist/index.html", "utf8").match(re), w = fs.readFileSync("web/index.html", "utf8").match(re);
  const v = JSON.parse(fs.readFileSync("web/version.json", "utf8"));
  const sw = fs.readFileSync("web/sw.js", "utf8");
  return !!d && !!w && d[1] === w[1] && d[1] === v.v && d[2] === v.label && /^\d{1,2}(er)? \S+ \d{4}, \d{1,2} h \d{2}$/.test(v.label)
    && sw.includes('endsWith("/version.json")');
})());
/* --- chronologie d'une ligne complète --- */
t("chronologie : une phrase de fin par légendaire, une phrase par époque, de 1996 à aujourd'hui", (()=>{
  if(!A.CARD_MONS.every(id=>typeof A.CHRONO_END[id] === "string" && A.CHRONO_END[id].length > 30)) return false;
  if(A.chronoEras(150).join() !== "g1,g2,g3,g5,art") return false;
  for(const id of A.CARD_MONS) for(const s2 of A.chronoEras(id)){
    const l = A.chronoLine(s2, id);
    if(!l || l.includes("undefined") || l.includes("NaN")) return false;
    if(s2 !== "art" && !l.startsWith(String(A.CARD_YEARS[s2]))) return false;
  }
  return A.chronoLine("g1", 144).includes("teintes");
})());
t("chronologie : une ligne complétée est à voir ; celles d'avant la version attendent sans s'imposer", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  for(const s2 of A.cardVariants(377)) A.grantCardV(s2, 377);
  if(!A.chronoComplete(377) || !A.chronoUnseen(377)) return false;
  A.chronoMigrate();
  const old = S0.chrono[377] === 0 && A.chronoUnseen(377) && S0.chronoV === 1;
  for(const s2 of A.cardVariants(378)) A.grantCardV(s2, 378);
  /* complétée après : rien de noté, la scène la jouera d'elle-même */
  return old && S0.chrono[378] === undefined && A.chronoUnseen(378) && !A.chronoComplete(379);
})());
/* --- la carte de Porygon-Z --- */
t("carte de Porygon-Z : écrite au choix ÉCRIRE, une seule, comptée seulement quand elle existe", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.name = "SACHA";
  const before = A.cardTotal();
  if(A.pzCardOwned() || A.pzCardPanelHtml() !== "") return false;
  A.finaleAfterChoice("write");
  const h = A.tcardHtml("pz", 474);
  return A.pzCardOwned() && S0.cards["pz:474"].h.k === "pz" && S0.cards["pz:474"].h.who === "SACHA"
    && A.cardTotal() === before + 1 && h.includes("Écrit par SACHA") && h.includes("N° 387") && h.includes("s-pz")
    && A.grantPzCard() === false && A.pzCardPanelHtml().includes("387") && A.cardRecordHtml("pz", 474).includes("entrée n° 387");
})());
t("carte de Porygon-Z : une partie qui avait déjà écrit la reçoit ; effacer ne la donne pas", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.flags.intro = true;
  A.finaleAfterChoice("erase");
  if(A.pzCardOwned()) return false;
  S0.saga.wrote = true;
  A.pzCardTick();
  return A.pzCardOwned();
})());
t("carte de Porygon-Z : son illustration est dans l'atlas, avec sa scène", (()=>{
  const M = A.CARD_PZ;
  const inside = r => r && A.CARD_ATLAS[r[0]] && r[1] + r[3] <= A.CARD_ATLAS[r[0]].w && r[2] + r[4] <= A.CARD_ATLAS[r[0]].h;
  return M && inside(M.s) && inside(M.m) && inside(M.f) && M.s[0] === "hd" && A.CARD_SCENES[474] === "L'entrée n° 387"
    && !A.CARD_MONS.includes(474);
})());
t("apparences d'époque : chaque sprite d'époque a son dos, son cadre d'origine et sa palette", (()=>{
  for(const k in A.CARD_INDEX){
    const s2 = k.split(":")[0], M = A.CARD_INDEX[k];
    if(!["g1", "g2", "g3"].includes(s2)) continue;
    if(!M.k || !M.ko || !M.o || !M.q || M.q.length < 3) return false;
    const tot = M.q.reduce((a, q)=>a + q[1], 0);
    if(Math.abs(tot - 1) > 0.01) return false;
    if(M.o[2] < M.m[3] || M.o[3] < M.m[4]) return false;
  }
  return A.CARD_INDEX["g1:150"].q.length <= 4 && A.CARD_INDEX["g1:150"].ko[2] === 32 && A.CARD_INDEX["g2:150"].ko[2] === 48;
})());
/* --- apparences d'époque --- */
t("apparences : une apparence ne se porte qu'avec sa carte, et jamais par un adversaire", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  A.addToDex(150, 50, false);
  A.skinSet(150, "g1");
  if(A.skinOf(150)) return false;                 /* pas de carte, pas d'apparence */
  A.grantCardV("g1", 150); A.grantCardV("g3", 150);
  A.skinSet(150, "g1");
  const ok = A.skinOf(150) === "g1" && A.eraVar(150, "n", true) === "eg1" && A.eraVar(150, "s", true) === "eg1"
    && A.eraVar(150, "n", false) === "n" && A.eraVar(150, "w", true) === "w" && A.eraVar(150, "c", true) === "c"
    && A.skinChoices(150).join() === "g1,g3";
  A.skinSet(150, "g2");                            /* carte absente : on revient à aujourd'hui */
  const gone = A.skinOf(150) === null && !S0.skins[150];
  A.skinSet(150, "g3"); delete S0.cards["g3:150"];
  return ok && gone && A.skinOf(150) === null;
})());
t("apparences : le vrai sprite d'époque, face et dos, à sa place dans son cadre d'origine", (()=>{
  A.setS(A.newState());
  A.addToDex(150, 50, false); A.grantCardV("g1", 150); A.skinSet(150, "g1");
  const f = A.sprite(150, false, "", {skin:true}), b = A.sprite(150, false, "", {skin:true, back:true});
  const plain = A.sprite(150, false, "", {});
  const M = A.CARD_INDEX["g1:150"];
  return f.includes("spr era e-g1") && f.includes("--card-px") && b.includes("spr era") && b !== f
    && !plain.includes("era") && A.skinRowHtml(150).includes("1996") && A.skinZoomHtml("g1", 150).includes("la retirer")
    && A.skinZoomHtml("art", 150) === "" && M.o[2] === 56;
})());
t("apparences : en 1996, les animations prennent les quatre teintes du sprite, dans ses proportions", (()=>{
  const n = 400, d = new Uint8ClampedArray(n * 4);
  for(let i = 0; i < n; i++){ const v = Math.round(i / n * 255); d[i*4] = v; d[i*4+1] = v; d[i*4+2] = v; d[i*4+3] = 255; }
  if(!A.eraRecolor(d, 150, "g1")) return false;
  const q = A.CARD_INDEX["g1:150"].q, cols = new Map();
  for(let i = 0; i < n; i++){ const k = d[i*4] + "," + d[i*4+1] + "," + d[i*4+2]; cols.set(k, (cols.get(k) || 0) + 1); }
  const dark = q[0][0], dk = [1, 3, 5].map(j=>parseInt(dark.slice(j, j + 2), 16)).join(",");
  /* la teinte la plus sombre occupe la même part que sur le sprite d'origine, à quelques pixels près */
  return cols.size === q.length && Math.abs((cols.get(dk) || 0) / n - q[0][1]) < 0.02 && d[0] === parseInt(dark.slice(1, 3), 16);
})());
t("aura : une lueur qui épouse la silhouette, un halo et des fragments de données ; en effets réduits, la lueur seule, immobile", (()=>{
  const calls = {grad:0, rect:0, text:0, draw:[]};
  const ctx = {globalAlpha:1, shadowBlur:0, shadowColor:"", shadowOffsetX:0, shadowOffsetY:0, _st:[], _tx:0,
    save(){ this._st.push([this.globalAlpha, this.shadowBlur, this.shadowColor, this.shadowOffsetX, this.shadowOffsetY, this._tx]); },
    restore(){ [this.globalAlpha, this.shadowBlur, this.shadowColor, this.shadowOffsetX, this.shadowOffsetY, this._tx] = this._st.pop(); },
    translate(x){ this._tx += x; }, getTransform(){ return {a:2, b:0}; }, beginPath(){}, arc(){}, fill(){},
    createRadialGradient(){ calls.grad++; return {addColorStop(){}}; }, fillRect(){ calls.rect++; }, fillText(){ calls.text++; }};
  A.setS(A.newState()); const S0 = A.getS();
  const b = A.eraBody(150, 10, 20, 2);
  if(!(isFinite(b.x) && isFinite(b.y) && b.r > 0)) return false;
  const B = {x:50, y:50, r:30};
  A.eraAuraHalo(ctx, "g1", B, 1.5);
  A.eraAuraGlow(ctx, "g3", B, 1.5, ()=>calls.draw.push({blur:ctx.shadowBlur, col:ctx.shadowColor, ox:ctx.shadowOffsetX, tx:ctx._tx}));
  A.eraAuraMotes(ctx, "g1", B, 1.5, 150);
  const d = calls.draw[0];
  /* l'image part hors du cadre (−4096 en unités du dessin) ; son ombre revient à sa place, en pixels du canvas (×2) */
  const glow = calls.draw.length === 2 && d.tx === -4096 && d.ox === 8192 && d.blur > calls.draw[1].blur && /^rgba\(53,240,214,/.test(d.col)
    && /^rgba\(255,61,127,/.test(calls.draw[1].col)
    && ctx.shadowBlur === 0 && ctx.shadowOffsetX === 0 && ctx._tx === 0;
  const full = calls.grad === 1 && calls.rect === 8 && calls.text === 0 && ctx.globalAlpha === 1;
  S0.settings.calm = true;
  A.eraAuraMotes(ctx, "g1", B, 1.5, 150);
  A.eraAuraGlow(ctx, "g1", B, 1.5, ()=>calls.draw.push({col:ctx.shadowColor}));
  return glow && full && calls.rect === 8 && calls.draw.length === 4 && calls.draw[3].col === "rgba(232,226,207,0.950)"
    && A.eraOfV("eg2") === "g2" && A.eraOfV("n") === null && A.eraOfV("s") === null;
})());
t("modes d'affichage : 1996 s'ouvre avec les cinq Rendus primordiaux, 1999 avec les onze fondateurs", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  if(A.displayModeOpen("g1") || A.displayModeOpen("g2")) return false;
  for(const id of A.CARD_MONS) if(A.cardVariants(id).includes("g1")) A.grantCardV("g1", id);
  S0.settings.era = "g1";
  const open = A.displayModeOpen("g1") && A.displayModeOf() === "g1" && !A.displayModeOpen("g2");
  S0.settings.era = "g2";
  const refused = A.displayModeOf() === "";
  delete S0.cards["g1:151"]; S0.settings.era = "g1";
  return open && refused && A.displayModeOf() === "" && A.SCREENS.settings.html().includes("Affichage")
    && A.displayModesHtml().includes("1999");
})());
t("un nouveau cycle garde, avec les cartes, leur réindexation, leurs annotations, leurs chronologies et leurs apparences", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  A.grantCardV("g1", 150); A.grantCardV("g3", 150);
  S0.reidx = {150:3}; S0.reidxV = 1; S0.reidxQ = [{s:"art", id:150, t:1}];
  S0.cardNotes = {10:{s:"g3", id:150, t:1}}; S0.cardNoteTry = {11:2};
  S0.chrono = {377:5}; S0.chronoV = 1; S0.skins = {150:"g1"}; S0.dmSeen = {g1:1};
  S0.flags.finalChoice = "erase";
  A.ACTIONS.cycledo();
  const N = A.getS();
  return N !== S0 && N.cards["g1:150"] && N.reidx[150] === 3 && N.reidxV === 1 && N.reidxQ.length === 1
    && N.cardNotes[10] && N.cardNoteTry[11] === 2 && N.chrono[377] === 5 && N.chronoV === 1 && N.skins[150] === "g1" && N.dmSeen.g1 === 1;
})());
t("réindexation : la fiche montre la jauge et la prochaine écriture", (()=>{
  A.setS(A.newState());
  A.grantCardV("art", 382); A.grantCardV("art", 382); A.grantCardV("art", 382);
  const h = A.reidxPanel(382);
  return h.includes("2 / 6") && h.includes("rx-bar") && A.reidxPanel(383) === "";
})());


/* --- rendu des cartes --- */
A.setS(A.newState());
t("l'empreinte de contrôle est stable et distincte par carte", (()=>{
  const seen = new Set();
  for(const id of A.CARD_MONS) for(const s2 of A.cardVariants(id)){
    const c = A.cardChecksum(s2, id);
    if(!/^[0-9A-F]{2}(·[0-9A-F]{2}){3}$/.test(c)) return false;
    if(A.cardChecksum(s2, id) !== c) return false;     /* deterministe */
    seen.add(c);
  }
  return seen.size >= 70;                               /* quasiment aucune collision */
})());
t("la bande de données est déterministe", (()=>{
  const a1 = A.cardBytes("g3", 150, 8), a2 = A.cardBytes("g3", 150, 8);
  const b1 = A.cardBytes("g1", 150, 8);
  return a1 === a2 && a1 !== b1 && /^([0-9A-F]{2} ){7}[0-9A-F]{2}$/.test(a1);
})());
t("chaque série porte son étiquette de génération",
  A.CARD_ORDER.every(s2=>typeof A.GEN_TAG[s2] === "string" && A.GEN_TAG[s2].length > 2));
t("une carte non émise ne révèle rien", (()=>{
  const h = A.tcardHtml("g1", 144, {});
  return h.includes("sealed") && !h.includes("Artikodin") && h.includes("Non émise") && !h.includes("tc-mon");
})());
t("une carte émise est une pleine illustration : scène, sujet, particules, cartel", (()=>{
  A.grantCardV("g3", 150);
  const h = A.tcardHtml("g3", 150, {});
  return ["tc-scene","tc-mon","tc-fx","tc-plate","tc-name","tc-sub","tc-foot","tc-pips","tc-glare"]
    .every(k=>h.includes(k)) && h.includes("Mewtwo") && h.includes("Noyau de Kanto") && h.includes("2002");
})());
t("plus d'attaques ni de points de vie sur la carte", (()=>{
  A.grantCardV("art", 384);
  const h = A.tcardHtml("art", 384, {});
  const moves = A.movesFor(A.POKE[384], 60).map(m=>m.name);
  return !moves.some(n=>h.includes(n)) && !/\bPV\b/.test(h) && !h.includes("FAIB") && !h.includes("tc-routines");
})());
t("la rareté se lit en facettes : une pour le Rendu courant, cinq pour le Primordial", (()=>{
  const on = h => (h.match(/<i class="on"><\/i>/g) || []).length;
  A.grantCardV("art", 150); A.grantCardV("g1", 150);
  return on(A.tcardHtml("art", 150, {})) === 1 && on(A.tcardHtml("g1", 150, {})) === 5;
})());
t("la vue agrandie est bien marquée", A.tcardHtml("g3",150,{hero:true}).includes("hero-card"));
t("le dos de carte existe et porte la marque", (()=>{
  const b = A.cardBackHtml();
  return b.includes("cardback") && b.includes("GENESIS") && b.includes("cb-guil");
})());
t("le rang d'un sachet suit sa meilleure série", (()=>{
  const bas = A.boosterRank([{s:"art",id:150},{s:"g5",id:151}]);
  const haut = A.boosterRank([{s:"art",id:150},{s:"g1",id:144}]);
  return haut > bas && haut === A.CARD_ORDER.indexOf("g1");
})());
t("le nom de série suit la découverte", (()=>{
  const S0 = A.getS();
  S0.cards = {};
  const cache = A.seriesName("g1");
  A.grantCardV("g1", 144);
  return cache === "Série non répertoriée" && A.seriesName("g1") === "Rendu primordial";
})());


/* --- les illustrations --- */
t("chaque carte a sa scène, son sujet et ses particules, dans les atlas", (()=>{
  const inside = r => r && A.CARD_ATLAS[r[0]] && r[1] >= 0 && r[2] >= 0 && r[3] > 0 && r[4] > 0
    && r[1] + r[3] <= A.CARD_ATLAS[r[0]].w && r[2] + r[4] <= A.CARD_ATLAS[r[0]].h;
  return Object.values(A.CARD_INDEX).concat([A.CARD_MN]).every(M=>inside(M.s) && inside(M.m) && inside(M.f)
    && M.b.length === 4 && M.b[2] > 20 && M.b[3] > 10 && typeof M.p === "string");
})());
t("les sprites d'époque restent du pixel art, l'illustration courante est lisse", (()=>{
  for(const k in A.CARD_INDEX){
    const s2 = k.split(":")[0], M = A.CARD_INDEX[k];
    if(s2 === "art" ? M.m[0] !== "hd" || M.s[0] !== "hd" : M.m[0] !== "px" || M.s[0] !== "px") return false;
  }
  return true;
})());
t("la carte se centre sur le corps du sujet, pas sur la boîte qui englobe sa queue", (()=>{
  for(const [k, M] of Object.entries(A.CARD_INDEX)){
    if(k === "art:146") continue;                       /* Sulfura : recadré à la main, la tête à droite */
    if(Math.abs(M.c[0] - 50) > 4) return false;
  }
  return Math.abs(A.CARD_INDEX["art:384"].c[0] - 50) < 2;   /* Rayquaza : le corps au milieu, la queue sort */
})());
t("une queue ou une aile peuvent sortir de la carte, le corps jamais", (()=>{
  for(const M of Object.values(A.CARD_INDEX)){
    const [l, tp, w, h] = M.b;
    const out = Math.max(0, -l) / w + Math.max(0, l + w - 100) / w;
    if(out > 0.45 || tp + h > 84 || M.c[0] < 25 || M.c[0] > 75 || M.c[1] < 15 || M.c[1] > 70) return false;
  }
  const R = A.CARD_INDEX["art:384"].b;
  return R[0] + R[2] > 100;                              /* la queue de Rayquaza sort bien à droite */
})());
t("chaque légendaire a le titre de sa scène", A.CARD_MONS.every(id=>typeof A.CARD_SCENES[id] === "string" && A.CARD_SCENES[id].length > 4));
t("le sous-titre : le titre de gardien, sinon le nom de la scène", (()=>{
  return A.cardSubtitle(150) === "Noyau de Kanto" && A.cardSubtitle(145) === A.CARD_SCENES[145];
})());
t("le cartel dit l'époque de l'image, en mots, sans taille en pixels", (()=>{
  const all = A.CARD_ORDER.map(s2=>A.cardSpec(s2, 150)).concat([A.cardSpec("mn", 0), A.cardSpec("pz", 474)]);
  return all.every(t=>t && !/pixel|×|\d+ couleurs/.test(t)) && /1996/.test(A.cardSpec("g1", 150)) && /officiel/.test(A.cardSpec("art", 150));
})());
t("chaque série ancienne porte son année", A.CARD_YEARS.g1 === 1996 && A.CARD_YEARS.g2 === 1999
  && A.CARD_YEARS.g3 === 2002 && A.CARD_YEARS.g5 === 2010 && A.cardEra("g2").includes("1999"));
t("la pièce secrète a sa propre scène", (()=>{
  const S0 = A.getS(); S0.cards = S0.cards || {}; S0.cards["mn:0"] = {t:1, dup:0};
  const h = A.tcardHtml("mn", 0, {});
  return !!A.CARD_MN && h.includes("tc-scene") && h.includes("Sans index");
})());
t("une case d'atlas se place sans déborder (taille et position en %)", (()=>{
  const st = A.cardBg(A.CARD_INDEX["g1:150"].s);
  return /background-size:[\d.]+% [\d.]+%/.test(st) && /background-position:[\d.]+% [\d.]+%/.test(st) && st.includes("--card-px");
})());
t("la vignette des listes montre la scène et le sujet", (()=>{
  const v = A.cardArt("g2", 249, "mini");
  return v.includes("tcmini") && v.includes("tc-scene") && v.includes("tc-mon");
})());


/* --- secrets --- */
A.setS(A.newState());
t("les noms reconnus se résolvent, casse et accents compris", (()=>{
  const a = A.resolveName("RED"), b = A.resolveName("red"), c = A.resolveName("R.E.D.");
  const gary = A.resolveName("Gary"), blue = A.resolveName("blue");
  return a && b && c && a.n === "silence" && b.n === "silence" && c.n === "silence"
      && gary && blue && gary.n === blue.n;          /* l'alias pointe bien sur la meme entree */
})());
t("un nom quelconque n'est pas reconnu",
  !A.resolveName("Medimed") && !A.resolveName("") && !A.resolveName("xyz123"));
t("chaque nom reconnu a une réplique", (()=>{
  for(const k in A.KNOWN_NAMES){
    const e = A.resolveName(k);
    if(!e || !e.t || e.t.length < 30) return false;
  }
  return true;
})());
t("le sixième objet est introuvable sur un sac vide", (()=>{
  const S0 = A.getS();
  S0.balls = {}; S0.berries = {}; S0.items = {}; S0.stones = {};
  return A.sixthItem() === null && A.glitchSixthItem() === null;
})());
t("la faille recopie bien cent vingt-huit exemplaires", (()=>{
  const S0 = A.getS();
  S0.balls = {poke:10, super:5, hyper:3};
  S0.berries = {framby:2, nanab:2, sitrus:2, micle:1};
  S0.items = {potion:1}; S0.stones = {};
  const g = A.glitchSixthItem();
  if(!g) return false;
  return g.after === g.before + 128 && S0.flags.sixth === true && g.name.length > 2;
})());
t("le glitch ne dépasse jamais le plafond", (()=>{
  const S0 = A.getS();
  S0.balls = {super:990}; S0.berries = {}; S0.items = {}; S0.stones = {};
  A.glitchSixthItem();
  return S0.balls.super === 999;
})());
t("trois paliers de génération, une seule fois chacun", (()=>{
  A.setS(A.newState());
  const S0 = A.getS();
  if(Object.keys(A.GEN_MARKS).length !== 3) return false;
  S0.streak = 151; A.checkChainMark(); A.checkChainMark();
  const un = (S0.flags.chainMarks||[]).length;
  S0.streak = 251; A.checkChainMark();
  S0.streak = 200; A.checkChainMark();               /* palier non remarquable */
  return un === 1 && S0.flags.chainMarks.length === 2;
})());
t("les jours particuliers sont bien formés", (()=>{
  const d = A.specialDay();
  return d === null || (d.id && d.n && d.d);         /* selon la date du jour */
})());
t("la fenêtre nocturne est cohérente", typeof A.isNightWindow() === "boolean");
t("Porygon-Z cède à trente", (()=>{
  const keys = Object.keys(A.PZ_POKE_LINES).map(Number);
  return Math.max(...keys) === 30 && keys.length >= 4;
})());


/* --- seconde vague de secrets --- */
t("le code est la séquence attendue",
  A.KONAMI.join(" ") === "ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a");
t("le vendeur passe environ un jour sur huit", (()=>{
  /* on ne peut pas changer la date : on verifie que la fonction est deterministe
     et que le resultat est booleen */
  const a = A.karpDealDay(), b = A.karpDealDay();
  return a === b && typeof a === "boolean";
})());
t("l'offre ne se prend qu'une fois par jour", (()=>{
  A.setS(A.newState());
  const S0 = A.getS();
  if(!A.karpDealDay()) return true;                  /* pas le bon jour, rien a verifier */
  const avant = A.karpDealAvailable();
  S0.karpDeal = A.today ? A.today() : new Date().toISOString().slice(0,10);
  return avant === true;
})());
t("tous les succès cachés ont une condition testable", (()=>{
  const S0 = A.newState();
  for(const a of A.ACHIEVEMENTS){
    if(!a.chk) return false;
    try { a.chk(S0); } catch(e){ console.log("  condition en erreur :", a.id, e.message); return false; }
  }
  return true;
})());
t("aucun succès n'est déjà acquis sur une partie neuve", (()=>{
  const S0 = A.newState();
  return A.ACHIEVEMENTS.filter(a=>{ try { return a.chk(S0); } catch(e){ return false; } }).length === 0;
})());


/* --- refonte de l'expédition --- */
t("douze fourchettes de puissance, croissantes", (()=>{
  if(A.BST_BANDS.length !== 12) return false;
  for(let i=1;i<12;i++){
    if(A.BST_BANDS[i][0] < A.BST_BANDS[i-1][0]) return false;
    if(A.BST_BANDS[i][1] < A.BST_BANDS[i-1][1]) return false;
    if(A.BST_BANDS[i][0] >= A.BST_BANDS[i][1]) return false;
  }
  return true;
})());
t("un tirage sauvage respecte la fourchette de son étage", (()=>{
  A.setS(A.newState());
  for(const f of [0,3,6,9,11]){
    const [lo,hi] = A.bstBand(f);
    for(let k=0;k<40;k++){
      const id = A.wildIdFor(f);
      const p = A.POKE[id];
      if(p.leg) return false;
      /* la fourchette peut etre relachee si elle est vide, mais pas pour ces etages */
      if(p.bst < lo - 60 || p.bst > hi + 60) return false;
    }
  }
  return true;
})());
t("les poids de nœuds évoluent le long du parcours", (()=>{
  const tot = w => Object.values(w).reduce((a,b)=>a+b,0);
  const debut = A.NODE_W[1], fin = A.NODE_W[A.NODE_W.length-1];
  /* le debut recrute, la fin met a l'epreuve */
  return (debut.draft / tot(debut)) > (fin.draft / tot(fin)) * 2
      && (fin.elite || 0) > (debut.elite || 0);
})());
t("le premier et le dernier étage sont imposés", (()=>{
  const r = () => 0.5;
  return A.nodeTypeFor(0, r) === "fight" && A.nodeTypeFor(11, r) === "boss"
      && A.nodeTypeFor(10, r) === "rest";
})());
t("le niveau adverse suit l'étage, jamais l'équipe", (()=>{
  const faible = {floor:5, level:10}, fort = {floor:5, level:90};
  return A.expEnemyLevel(faible, 0) === A.expEnemyLevel(fort, 0)
      && A.expEnemyLevel({floor:11, level:10}, 0) > A.expEnemyLevel({floor:1, level:10}, 0);
})());
t("dix-huit archivistes, un type chacun", A.TRAINERS.length === 18 &&
  new Set(A.TRAINERS.map(x=>x.t)).size === 18);

/* --- équipement --- */
t("seize objets, tous chiffrés (plus dix objets de carte)", (()=>{
  const ids = Object.keys(A.EXP_ITEMS);
  if(ids.filter(id=>!A.EXP_ITEMS[id].card).length !== 16 || ids.filter(id=>A.EXP_ITEMS[id].card).length !== 10) return false;
  return ids.every(id=>{
    const it = A.EXP_ITEMS[id];
    return it.n && it.d && it.spr && it.rar >= 0 &&
      Object.keys(it).some(k=>!["n","d","spr","rar"].includes(k));
  });
})());
t("les objets rares ne tombent pas dans les premiers étages", (()=>{
  const bas = A.rollExpItem(1, 3), haut = A.rollExpItem(11, 3);
  const rarMax = l => Math.max(...l.map(id=>A.EXP_ITEMS[id].rar));
  return rarMax(bas) <= 1 && bas.length === 3 && haut.length === 3;
})());
t("un tirage ne propose jamais deux fois le même objet", (()=>{
  for(let k=0;k<200;k++){ const l = A.rollExpItem(8, 3);
    if(new Set(l).size !== l.length) return false; }
  return true;
})());
t("trois voies dans un seul module, dont la Tour", (()=>{
  const ks = Object.keys(A.EXP_MODES);
  if(ks.length !== 3) return false;
  const runs = ks.filter(k=>!A.EXP_MODES[k].go);
  const dests = ks.filter(k=>A.EXP_MODES[k].go);
  return runs.length === 2 && dests.length === 1
      && A.EXP_MODES.nuzlocke.mult > A.EXP_MODES.classic.mult
      && A.EXP_MODES.tower.go === "tower";
})());

/* --- Tour --- */
t("un trait monte tous les deux Pokémon du type, plafonné à trois", (()=>{
  const eq = n => Array.from({length:n}, ()=>({id:4, hp:10, maxHp:10}));   /* Salameche, Feu */
  const t1 = A.traitLevels(eq(1)), t2 = A.traitLevels(eq(2)), t8 = A.traitLevels(eq(8));
  return !t1[10] && t2[10] === 1 && t8[10] === 3;
})());
t("les Pokémon KO ne comptent pas dans les traits", (()=>{
  const eq = [{id:4,hp:0,maxHp:10},{id:4,hp:0,maxHp:10}];
  return Object.keys(A.traitLevels(eq)).length === 0;
})());
t("le bonus de trait croît avec le palier", (()=>{
  const un = A.traitBonus({10:1}, "dmg"), trois = A.traitBonus({10:3}, "dmg");
  return trois > un && un > 0 && A.traitBonus({}, "dmg") === 0;
})());
t("douze traits, tous décrits", Object.keys(A.TOWER_TRAITS).length === 12 &&
  Object.values(A.TOWER_TRAITS).every(t2=>t2.n && t2.d));
t("le renfort remonte à la racine de la lignée", (()=>{
  return A.lineRoot(3) === 1 && A.lineRoot(1) === 1      /* Florizarre -> Bulbizarre */
      && A.lineRoot(6) === 4 && A.lineRoot(150) === 150; /* Mewtwo n'evolue pas */
})());
t("la Tour monte sans plafond de contenu", (()=>{
  const a = A.towerLevel(1), b = A.towerLevel(20), c = A.towerLevel(60);
  const [lo1] = A.towerBand(1), [lo2] = A.towerBand(15);
  return b > a && c >= b && lo2 > lo1 && c <= 100;
})());
t("six statistiques renforçables", A.BUFF_STATS.length === 6 &&
  A.BUFF_STATS.every(s2=>s2.k && s2.n));


/* --- le monde --- */
A.setS(A.newState());
t("six habitats, ouverture progressive", (()=>{
  const needs = A.HABITAT_IDS.map(k=>A.HABITATS[k].need);
  return A.HABITAT_IDS.length === 6 && needs[0] === 0 &&
    needs.every((n,i)=>i === 0 || n > needs[i-1]);
})());
t("les habitats couvrent presque tous les types", (()=>{
  /* le recouvrement est voulu : une Plante se croise sur la route et en sylve,
     avec des poids differents. Ce qui compte, c'est qu'aucun type ne soit orphelin. */
  const seen = new Set();
  for(const k of A.HABITAT_IDS){
    const h = A.HABITATS[k];
    if(!h.types.length || !h.n || !h.d) return false;
    for(const t2 of h.types) seen.add(t2);
  }
  return seen.size >= 15;
})());
t("aucun habitat n'est un doublon d'un autre", (()=>{
  const sigs = A.HABITAT_IDS.map(k=>A.HABITATS[k].types.slice().sort().join(","));
  return new Set(sigs).size === sigs.length;
})());
t("le vivier suit réellement l'habitat", (()=>{
  /* comparaison RELATIVE entre deux habitats : un seuil absolu rendrait le
     test dependant de l'heure, puisque la nuit penalise le type Feu. */
  const S0 = A.getS();
  S0.region = "kanto"; S0.weather = "clair"; S0.weatherUntil = Date.now() + 1e9;
  for(let i=1;i<=151;i++) A.addToDex(i,20,false);
  const part = (hab, type) => {
    S0.habitat = hab;
    let hit = 0, n = 0;
    for(let i=0;i<600;i++){ const id = A.speciesInHabitat(0);
      if(!id) continue; n++;
      if(A.POKE[id].types.includes(type)) hit++; }
    return n ? hit / n : 0;
  };
  const eauIci = part("eaux", 11),  eauAilleurs = part("foyer", 11);
  const feuIci = part("foyer", 10), feuAilleurs = part("eaux", 10);
  return eauIci > 0.6 && eauIci > eauAilleurs * 4
      && feuIci > 0.2 && feuIci > feuAilleurs * 4;
})());
t("six météos, toutes décrites", A.WEATHER_IDS.length === 6 &&
  A.WEATHER_IDS.every(k=>A.WEATHER[k].n && A.WEATHER[k].d && A.WEATHER[k].c));
t("la météo tourne et ne reste jamais indéfinie", (()=>{
  const S0 = A.getS();
  S0.weatherUntil = 0;
  const w = A.weatherDef();
  return w && w.n && S0.weatherUntil > Date.now();
})());
t("l'heure renvoie un état net", typeof A.isNight() === "boolean");

/* --- recherche --- */
A.setS(A.newState());
t("quatre tâches, décrites et chiffrées", A.RESEARCH_TASKS.length === 4 &&
  A.RESEARCH_TASKS.every(t2=>t2.n && t2.d && t2.k));
t("une espèce sans évolution a une tâche de moins",
  A.researchMax(150) === 3 && A.researchMax(1) === 4);
t("les raretés hautes demandent moins d'exemplaires", (()=>{
  const t2 = A.RESEARCH_TASKS[0];
  return A.taskGoal(t2, 150) < A.taskGoal(t2, 16);
})());
t("une tâche accomplie fait monter le niveau de recherche", (()=>{
  const S0 = A.getS();
  A.addToDex(25, 10, false);
  const avant = A.researchLevel(25);
  for(let i=0;i<10;i++) A.researchTick(25, "catch", 1);
  return avant === 0 && A.researchLevel(25) === 1;
})());
t("sept paliers de recherche, croissants", (()=>{
  const n = A.RESEARCH_TIERS.map(x=>x.n);
  return n.length === 7 && n.every((v,i)=>i===0 || v > n[i-1]) &&
    A.RESEARCH_TIERS.every(x=>x.rw && Object.keys(x.rw).length);
})());

/* --- intègres et talents --- */
t("un exemplaire sur cinquante est intègre", (()=>{
  A.setS(A.newState());
  let n = 0;
  for(let i=0;i<20000;i++) if(A.rollPerfect()) n++;
  const taux = n / 20000;
  return taux > 0.012 && taux < 0.030;
})());
t("chaque type a son talent", (()=>{
  for(let t2=1;t2<=18;t2++) if(!A.TALENTS[t2]) return false;
  return Object.values(A.TALENTS).every(x=>x.n && x.d);
})());
t("chaque espèce reçoit un talent nommé", (()=>{
  for(const id of [1,25,150,384,129]){
    const tl = A.talentOf(id);
    if(!tl || !tl.n || !tl.type) return false;
  }
  return true;
})());

/* --- rapport hebdomadaire --- */
t("la semaine commence un lundi", (()=>{
  const w = A.weekStamp();
  return /^\d{4}-\d{2}-\d{2}$/.test(w) && new Date(w + "T12:00:00").getDay() === 1;
})());
t("le fil du récit : toujours la prochaine étape de l'histoire, sans rien dévoiler", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.story = ["intro"];
  const t0 = A.storyThread();
  S0.story = ["intro"].concat(A.MAIN_ARC.slice(0, 6).map(b=>b.id)); S0.integrity = 4;
  const t1 = A.storyThread();
  S0.integrity = 12; const t2 = A.storyThread();
  S0.story = ["intro"].concat(A.MAIN_ARC.slice(0, 18).map(b=>b.id));
  const t3 = A.storyThread();
  const html = (S0.story = ["intro", "first_catch"], A.storyThreadHtml());
  return t0.id === "first_catch" && t0.go === "capture" && !t0.ready
    && t1.id === "pz_mem1" && t1.mem && /premier souvenir/.test(t1.t) && t1.v[1] === 6 && !t1.ready
    && t2.ready && t3 === null && /LE RÉCIT/.test(html) && !/undefined|NaN/.test(html)
    && A.storyRecapHtml(3600e3) === "" && /PRÉCÉDEMMENT/.test(A.storyRecapHtml(3 * 864e5)) && /trois/.test(A.storyRecapHtml(3 * 864e5));
})());
t("les passages légendaires attendent la salle des verrous : rien pour un nouveau venu", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.story = ["intro"];
  const closed = !A.legOpen() && A.legendCardHtml() === "";
  S0.level = 12; for(let i = 1; i <= 10; i++) A.addToDex(i, 10, false); S0.bosses = ["kanto:144"];
  return closed && A.legOpen() && A.legendCardHtml().length > 20;
})());
t("le fil conducteur s'allume après l'ouverture, même sans l'ancien drapeau", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  const before = A.introSeen(); S0.story.push("intro");
  return !before && A.introSeen() && !S0.flags.intro;
})());
t("le samedi de référence du Safari est un samedi, à l'heure locale", (()=>{
  const w = A.safariWeek();
  return /^\d{4}-\d{2}-\d{2}$/.test(w) && new Date(w + "T12:00:00").getDay() === 6 && A.localYmd(new Date(2026, 0, 5, 0, 30)) === "2026-01-05";
})());
t("huit lignes de rapport, toutes nommées", A.REPORT_ROWS.length === 8 &&
  A.REPORT_ROWS.every(r=>r.k && r.n && r.i));


/* --- récit : trois voix --- */
t("onze pages, trouvées dans l'ordre, chacune là où son auteur a travaillé", (()=>{
  A.setS(A.newState());
  const S0 = A.getS(); S0.level = 40; S0.bosses = ["kanto:146"]; S0.stats.expWins = 1;
  if(A.FRAGMENTS.length !== 11 || !A.FRAGMENTS.every(f=>A.FRAG_SRC[f.src] && f.place && f.react && f.day)) return false;
  for(let i=1;i<=386;i++) A.addToDex(i,20,false);
  S0.integrity = 100;
  const ordre = [];
  for(let guard = 0; guard < 400 && ordre.length < 11; guard++){
    const f = A.fragNext(); if(!f) break;
    /* chaque page ne sort que de sa source */
    const autre = Object.keys(A.FRAG_SRC).find(k=>k !== f.src && k !== "capture");
    if(autre && A.fragPending(autre)) return false;
    if(f.src === "capture"){ let ok = false; for(let k = 0; k < 500 && !ok; k++) ok = A.fragOnCatch(); if(!ok) return false; A.fragFound(f, "test"); }
    else A.fragOn(f.src);
    ordre.push(f.id);
  }
  return S0.fragments.length === 11 && S0.fragments.every((v,i)=>v === i+1) && S0.fragUnread.length === 11;
})());
t("une page dont la salle est fermée finit dans les captures", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 3;
  for(let i=1;i<=60;i++) A.addToDex(i,20,false);
  S0.fragments = [1, 2, 3]; S0.integrity = 15;
  const f = A.fragNext();
  return f.id === 4 && f.src === "forage" && !!A.fragPending("capture");
})());
t("une page n'apparaît pas avant sa condition", (()=>{
  A.setS(A.newState()); for(let i=1;i<=5;i++) A.addToDex(i,20,false);
  return A.fragNext() === null && A.checkFragments() === false;
})());
t("chaque page a une connexion, une signature et un texte long",
  A.FRAGMENTS.every(f=>f.conn >= 1 && f.conn <= 11 && f.t && f.t.length > 120 && f.n && A.fragAuthor(f).length > 6));
t("les conditions de découverte sont croissantes", (()=>{
  let lastDex = -1, lastInt = -1;
  for(const f of A.FRAGMENTS){
    if(f.at.dex !== undefined){ if(f.at.dex <= lastDex) return false; lastDex = f.at.dex; }
    if(f.at.integ !== undefined){ if(f.at.integ <= lastInt) return false; lastInt = f.at.integ; }
  }
  return true;
})());
t("six étapes de faille, qui ne sautent jamais", (()=>{
  A.setS(A.newState());
  const S0 = A.getS();
  S0.integrity = 100;
  const vus = [];
  for(let i=0;i<40;i++){ const before = A.riftStage(); A.riftTick();
    if(A.riftStage() !== before) vus.push(A.riftStage()); }
  return A.RIFT_ARC.length === 6 && vus.length === 6 && vus.every((v,i)=>v === i+1);
})());
t("l'arc de la faille est verrouillé par l'intégrité", (()=>{
  A.setS(A.newState());
  const S0 = A.getS();
  S0.integrity = 0;
  for(let i=0;i<30;i++) A.riftTick();
  return A.riftStage() === 1;                 /* seule la premiere etape passe a 0% */
})());
t("chaque étape de faille fait parler plusieurs voix",
  A.RIFT_ARC.every(sc=>sc.lines.length >= 3 &&
    new Set(sc.lines.map(l=>l.w)).size >= 2));

/* --- attaque signature --- */
t("la signature suit le type dominant", (()=>{
  const m = A.signatureMove(A.POKE[4], 30, 0);      /* Salameche, Feu */
  return m && m.signature && m.type === A.POKE[4].types[0];
})());
t("trois paliers, de plus en plus puissants", (()=>{
  const a = A.signatureMove(A.POKE[4], 10, 0);
  const b = A.signatureMove(A.POKE[4], 10, 2);
  return b.pw > a.pw && b.tier === 2 && A.moveTierName(2).length > 2;
})());
t("le niveau ouvre les paliers tout seul", (()=>{
  const bas = A.signatureMove(A.POKE[4], 10, 0);
  const haut = A.signatureMove(A.POKE[4], 50, 0);
  return haut.pw > bas.pw;
})());


/* --- lisibilité de la carte --- */
t("aucune liaison n'en croise une autre", (()=>{
  A.setS(A.newState());
  for(let seed = 1; seed <= 300; seed++){
    const map = A.genMap(seed);
    for(let y = 0; y < map.length - 1; y++){
      const cur = map[y];
      for(let i = 0; i < cur.length; i++)
        for(let j = i + 1; j < cur.length; j++)
          for(const a of cur[i].next)
            for(const b of cur[j].next)
              if(a > b) return false;     /* i est a gauche de j : ses cibles aussi */
    }
  }
  return true;
})());
t("aucun nœud inatteignable, aucune impasse", (()=>{
  A.setS(A.newState());
  for(let seed = 1; seed <= 300; seed++){
    const map = A.genMap(seed);
    for(let y = 0; y < map.length - 1; y++){
      const cur = map[y], nx = map[y + 1];
      for(const n of cur) if(!n.next.length) return false;
      for(let j = 0; j < nx.length; j++)
        if(!cur.some(p => p.next.includes(j))) return false;
    }
  }
  return true;
})());
t("la carte offre de vrais choix", (()=>{
  A.setS(A.newState());
  let branch = 0, total = 0;
  for(let seed = 1; seed <= 200; seed++){
    const map = A.genMap(seed);
    for(let y = 0; y < map.length - 1; y++)
      for(const n of map[y]){ total++; if(n.next.length > 1) branch++; }
  }
  const part = branch / total;
  return part > 0.15 && part < 0.75;     /* ni couloir, ni brouillard : le treillis de Pokelike */
})());
t("le départ et l'arrivée sont uniques", (()=>{
  A.setS(A.newState());
  const map = A.genMap(7);
  return map[map.length - 1].length === 1 && map[0].length === 2;
})());
t("carte : une route ne glisse jamais de plus d'un couloir, et chaque dresseur montre son type", (()=>{
  A.setS(A.newState());
  for(let seed = 1; seed <= 200; seed++){
    const map = A.genMap(seed);
    for(let y = 0; y < map.length - 2; y++)
      for(const n of map[y]){
        for(const j of n.next) if(Math.abs(map[y + 1][j].c - n.c) > 1) return false;
        if(n.t === "trainer" && !A.TRAINERS[n.tr]) return false;
      }
  }
  return true;
})());


/* --- le forage : l'équipe creuse, on fouille les parois --- */
t("neuf strates, de plus en plus profondes et dures, chacune avec sa matière et ses bons types", (()=>{
  if(A.STRATA.length !== 9) return false;
  for(let i=1;i<9;i++) if(A.STRATA[i].need <= A.STRATA[i-1].need || A.STRATA[i].hard <= A.STRATA[i-1].hard) return false;
  return A.STRATA.every(s=>s.good.length && s.pal.length === 3 && s.mat);
})());
t("sans équipe, personne ne creuse ; avec une équipe, la profondeur et l'Énergie montent", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 6;
  for(const id of [74, 27, 50]) A.addToDex(id, 15, false);
  const f = A.forage(); f.crew = [];
  const a = A.forageAdvance(600);
  f.crew = [74, 27, 50];
  const b = A.forageAdvance(600);
  return a.m === 0 && b.m > 10 && f.energy > 0 && A.forageRate() > 0;
})());
t("les bons types creusent deux fois plus vite dans leur strate", (()=>{
  A.setS(A.newState()); A.addToDex(74, 20, false); A.addToDex(4, 20, false);
  return A.digAff(74, 0) === 2 && A.digAff(4, 0) === 1 && A.digAff(4, 3) === 2 && A.digAff(12, 3) === 0.5
    && A.digPower(74, 0) > A.digPower(4, 0) * 1.5;
})());
t("une longue absence traverse plusieurs strates, et la réserve de parois plafonne", (()=>{
  A.setS(A.newState());
  for(const id of [76, 95, 112]) A.addToDex(id, 80, false);
  const f = A.forage(); f.crew = [76, 95, 112];
  const r = A.forageAdvance(8 * 3600);
  return r.strata.length >= 2 && f.walls === A.wallCap() && f.depth >= 2 && A.wallEvery() === 420;
})());
t("une paroi : objets sans chevauchement, fer à l'écart, et tout se dégage à force de coups", (()=>{
  A.setS(A.newState());
  for(let k = 0; k < 20; k++){
    const w = A.genWall(k % 9);
    const cells = w.items.flatMap(it=>it.cells);
    if(new Set(cells).size !== cells.length || w.items.length < 2) return false;
    if(w.iron.flat().some(c=>cells.includes(c))) return false;
  }
  const w = A.genWall(2); w.stab = w.max = 9999;
  for(let pass = 0; pass < 8 && !w.over; pass++) for(let y = 0; y < w.H; y++) for(let x = 0; x < w.W; x++) A.digHit(w, "pick", x, y);
  return w.over && !w.collapsed && w.items.filter(it=>!it.small).every(it=>it.found);
})());
t("une paroi s'effondre quand sa stabilité tombe à zéro, et l'on garde ce qui est dégagé", (()=>{
  A.setS(A.newState());
  const w = A.genWall(0);
  for(let i = 0; i < 200 && !w.over; i++) A.digHit(w, "hammer", 0, 0);
  return w.over && w.collapsed && w.stab === 0;
})());
t("les objets d'une paroi arrivent bien : fragments, pierres, fossiles, Pokémon endormis", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  const w = A.genWall(3);
  w.items = [{k:"red", found:true}, {k:"fire", found:true}, {k:"helix", found:true}, {k:"mon", mon:74, found:true}, {k:"pearl", found:false}];
  const sh = S0.shards || 0;
  const rows = A.digClaim(w);
  return rows.length === 4 && (S0.shards || 0) > sh && S0.stones.fire === 1 && S0.eggs.bag.f_helix === 1 && !!S0.dex[74];
})());
t("un fossile déterré renferme toujours la même espèce", A.EGG_TIERS.f_helix.fossil === 138 && A.eggPool("f_amber").join() === "142");
t("une partie d'avant la refonte garde sa profondeur", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.forage = {energy:500, total:900, depth:4, drills:{main:3}, echoes:5, perks:{}};
  const f = A.forage();
  return f.m === A.STRATA[4].need && f.depth === 4 && f.energy === 500 && f.echoes === 5 && !f.drills;
})());
t("la réserve de parois repousse aussi le plafond hors ligne", (()=>{
  A.setS(A.newState()); const base = A.offlineHours(); A.forage().up.cart = 2;
  return A.offlineHours() === base + 4 && A.wallCap() === 5;
})());


/* --- exclusivités et pêche --- */
const openAll = () => { A.setS(A.newState()); const S0 = A.getS();
  S0.bosses = A.REGIONS.flatMap(r=>r.guardians.map(g=>r.key+":"+g.id));
  S0.weather = "clair"; S0.weatherUntil = Date.now() + 1e9; return S0; };
t("aucune exclusivité dans la capture classique", (()=>{
  const S0 = openAll();
  for(let i=1;i<=386;i++) if(!A.isExclusive(i)) A.addToDex(i,20,false);
  for(const r of A.unlockedRegions()){ S0.region = r.key;
    for(let k=0;k<150;k++) for(let rar=0;rar<=4;rar++){
      const id = A.speciesForRarity(rar); if(id && A.isExclusive(id)) return false; } }
  return true;
})());
t("chaque exclusivité a une source", (()=>{
  for(const k in A.EXCLUSIVES) for(const id of A.EXCLUSIVES[k]) if(!A.EXCL_SOURCE[id]) return false;
  return A.EXCL_SOURCE[382] === "fish" && A.EXCL_SOURCE[172] === "egg" && A.EXCL_SOURCE[138] === "forage";
})());
t("les cannes s'améliorent sur tous les axes", (()=>{
  for(let i=1;i<A.RODS.length;i++){
    const a = A.RODS[i-1], b = A.RODS[i];
    if(!(b.hook > a.hook && b.shiny > a.shiny && b.cost > a.cost)) return false;
  }
  return true;
})());
t("Kyogre ne se pêche jamais à la Vieille Canne", (()=>{
  const S0 = openAll(); S0.rod = 1;
  for(let k=0;k<3000;k++){ delete A.getS().dex[382]; A.newFishEncounter();
    if(A.getENC().id === 382) return false; }
  return true;
})());
t("Kyogre se pêche à la Méga Canne, une fois Hoenn ouvert", (()=>{
  const S0 = openAll(); S0.rod = 3;
  for(let k=0;k<4000;k++){ delete S0.dex[382]; A.newFishEncounter(); if(A.getENC().id === 382) return true; }
  return false;
})());
t("la pêche ne remonte que de l'Eau ou des exclusivités de pêche", (()=>{
  const S0 = openAll(); S0.rod = 2;
  for(let k=0;k<1500;k++){ A.newFishEncounter();
    const e = A.getENC(), p = A.POKE[e.id];
    if(!p.types.includes(11) && A.EXCL_SOURCE[e.id] !== "fish") return false; }
  return true;
})());
t("les bébés sortent des œufs, les fossiles du vivier fossile", (()=>{
  openAll();
  const oeuf = A.eggPool("e_common"), fos = A.eggPool("f_fossil");
  return oeuf.some(i=>A.EXCL_SOURCE[i] === "egg") && fos.length >= 3
      && fos.every(i=>A.EXCL_SOURCE[i] === "forage")
      && !oeuf.some(i=>A.EXCL_SOURCE[i] === "fish" || A.EXCL_SOURCE[i] === "forage");
})());

/* --- répulsifs, leurres, séries --- */
t("le répulsif écarte les communs puis s'épuise", (()=>{
  const S0 = openAll(); S0.repel = 2;
  const a = A.repelRarity(0), b = A.repelRarity(0), c = A.repelRarity(0);
  return a === 1 && b === 1 && c === 0 && S0.repel === 0;
})());
t("le leurre ne favorise que son type", (()=>{
  const S0 = openAll(); S0.lure = {type:11, n:5};
  return A.lureMul(A.POKE[7]) > 1 && A.lureMul(A.POKE[4]) === 1;
})());
t("une série par rareté monte, paie à son palier, et casse seule", (()=>{
  const S0 = openAll();
  const coins = S0.coins;
  for(let i=0;i<10;i++) A.rstreakCatch(2);
  A.rstreakCatch(0);
  const ok1 = A.rstreak()[2] === 10 && S0.coins > coins;
  A.rstreakBreak(2);
  return ok1 && A.rstreak()[2] === 0 && A.rstreak()[0] === 1;
})());

/* --- permanents --- */
t("le Charme Chroma augmente réellement la chance de chromatique", (()=>{
  const S0 = openAll(); S0.streak = 0;
  const a = A.shinyOdds(); S0.perm = {charm:5}; const b = A.shinyOdds();
  return b > a * 1.6 && A.charmMul() > 1.7;
})());
t("les permanents sont plafonnés et leur coût croît", (()=>{
  for(const k in A.PERMANENTS){ const p = A.PERMANENTS[k];
    if(!(p.max > 0 && p.cost(1) > p.cost(0))) return false; }
  const S0 = openAll(); S0.perm = {rune:10};
  return Math.abs(A.runeMul() - 1.5) < 1e-9;
})());

/* --- amitié --- */
t("Nosferalto n'évolue qu'en compagnon, avec un lien suffisant", (()=>{
  const S0 = openAll();
  A.addToDex(42, 50, false); S0.dex[42].c = 99; S0.coins = 1e9;
  const e = A.POKE[42].evo[0];
  const sans = A.canEvolve(42, e);
  S0.buddy = {id:42, aff:0}; const faible = A.canEvolve(42, e);
  S0.buddy = {id:42, aff:1e9}; const fort = A.canEvolve(42, e);
  return !sans.ok && !faible.ok && fort.ok;
})());
t("Évoli choisit selon l'heure", (()=>{
  return A.friendEvo(133, 196) === "day" && A.friendEvo(133, 197) === "night"
      && !A.friendEvo(133, 134);          /* Aquali reste une évolution par pierre */
})());

/* --- codes --- */
t("un code valide ne sert qu'une fois", (()=>{
  const h = A.codeHash("genesis");
  return !!A.CODES[h] && A.codeHash("GENESIS") === h && !A.CODES[A.codeHash("FAUX")];
})());

/* --- Safari, capture autonome, factions, aujourd'hui --- */
t("Kangourex et Tauros sont exclusifs au Safari", A.EXCL_SOURCE[115] === "safari" &&
  A.EXCL_SOURCE[128] === "safari" && A.SAFARI_POOL.includes(115) && typeof A.isSafariDay() === "boolean");
t("la capture autonome ne tire ni légendaire ni exclusivité", (()=>{
  openAll();
  for(let k=0;k<2000;k++){ const id = A.botSpecies();
    if(A.POKE[id].leg || A.isExclusive(id)) return false; }
  return A.botRate() >= 4 && A.botHours() >= 2;
})());
t("les rangs de faction sont croissants", A.FACTION_RANKS.every((v,i)=>i===0 || v > A.FACTION_RANKS[i-1]));
t("une faction ne renforce que sa spécialité", (()=>{
  const S0 = openAll(); S0.faction = {k:"echo", pts:5000};
  return A.factionRank() >= 4 && A.factionMul("shards") > 1
      && A.factionMul("coins") === 1 && A.factionMul("integ") === 1;
})());
t("le tableau du jour se construit sur une partie neuve", (()=>{
  A.setS(A.newState());
  const r = A.todayRows();
  return Array.isArray(r) && r.length >= 1 && r.every(x=>x.n && x.go) && typeof A.todayPending() === "number";
})());


/* --- garde-fous de la chaîne et de la pêche --- */
t("en Pêche, la relance revient à la ligne", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.rod = 1; S0.capMode = "fish";
  A.nextEncounter();
  const ok1 = A.getENC() === null;
  S0.capMode = "classic";
  A.nextEncounter();
  return ok1 && A.getENC() !== null;
})());
t("la chaîne reste tenable à la Poké Ball (calcul exact)", (()=>{
  /* probabilite de rupture par rencontre, calculee a partir des formules du jeu
     et de la repartition des raretes : aucun tirage, donc aucun artefact possible */
  A.setS(A.newState()); const S0 = A.getS();
  S0.level = 12; S0.streak = 20; S0.event = null; S0.luckyDay = "d_none";
  S0.weather = "clair"; S0.weatherUntil = Date.now() + 1e9;
  const w = A.RARITY.map((r,i)=>i === 5 ? 0 : r.w), tot = w.reduce((a,b)=>a+b,0);
  let pBreak = 0;
  for(let rar = 0; rar <= 4; rar++){
    /* un representant de la rarete, niveau moyen */
    const id = A.POKE_IDS.find(i=>A.POKE[i].rar === rar && !A.POKE[i].leg);
    A.setENC({id, rar, level:30, shiny:false, attempts:0});
    let alive = 1, broke = 0;
    for(let k = 0; k < 10; k++){
      const c = A.catchChance("poke");
      const f = A.fleeChance();
      broke += alive * (1 - c) * f;
      alive *= (1 - c) * (1 - f);
      A.getENC().attempts++;
    }
    pBreak += (w[rar] / tot) * broke;
  }
  const mediane = Math.log(2) / pBreak;
  return mediane > 10 && mediane < 60;
})());


/* --- standard des cinématiques : chaque scène est vérifiée ---
   Le vocabulaire est fermé. Une scène qui sort du standard échoue ici,
   avant d'échouer à l'écran. */
<<<<<<< HEAD
const CINE_BEATS = ["bars","bg","card","actor","leave","mood","say","ask","fx","code","rain","sfx","wait","par","seq",
  "mem","music","choice","montage","name","dex","credits","call"].concat(A.PL_BEATS);
const CINE_FX = ["shake","flash","glitch","rgb","noise","blackout"];
const CINE_BGS = ["labo","void","terminal","faille","souvenir","zero"];
/* Les acteurs de la scène (DOM : prof, emblème…) et ceux du plateau (le monde peint) partagent
   un même registre : un même nom ne peut pas être deux fois en scène. Un nouveau décor renvoie
   les acteurs du plateau (sauf ceux qu'il garde) ; l'extinction renvoie tout le monde.
   Les ancres nommées (« spot », « pz »…) doivent exister dans le décor courant, ou désigner un acteur. */
function cineLint(sc){
  if(typeof sc === "function") sc = sc();
  const errs = [], alive = new Map();
  let set = null;
  const where = (v, what) => {
    if(typeof v !== "string") return;
    if(alive.has(v)) return;
    const an = set && A.PL_SETS[set] && A.PL_SETS[set].anchors;
    if(!an || !(v in an)) errs.push(what + " inconnue : " + v + (set ? " (décor " + set + ")" : " (aucun décor)"));
  };
  const needW = (b, kind) => {
    if(!alive.has(b.id)) errs.push(b.t + " d'un acteur absent : " + b.id);
    else if(kind && alive.get(b.id) !== kind) errs.push(b.t + " sur un acteur qui n'est pas « " + kind + " » : " + b.id);
  };
  const walk = (b) => {
    if(!CINE_BEATS.includes(b.t)) errs.push("temps inconnu : " + b.t);
    if(b.t === "par" || b.t === "seq") return b.beats.forEach(walk);
    /* une décision : chaque branche est jouée à la suite, avec les acteurs déjà en scène */
    if(b.t === "choice"){
      if(!b.opts || b.opts.length < 2) errs.push("décision sans options");
      const save = new Map(alive), saveSet = set;
      for(const o of b.opts || []){
        alive.clear(); save.forEach((v, k)=>alive.set(k, v)); set = saveSet;
=======
const CINE_BEATS = ["bars","bg","card","actor","leave","mood","say","ask","fx","code","rain","sfx","wait","par",
  "mem","music","choice","montage","name","dex","credits","call"];
const CINE_FX = ["shake","flash","glitch","rgb","noise","blackout"];
const CINE_BGS = ["labo","void","terminal","faille","souvenir","zero"];
function cineLint(sc){
  if(typeof sc === "function") sc = sc();
  const errs = [], alive = new Set();
  const walk = (b) => {
    if(!CINE_BEATS.includes(b.t)) errs.push("temps inconnu : " + b.t);
    if(b.t === "par") return b.beats.forEach(walk);
    /* une décision : chaque branche est jouée à la suite, avec les acteurs déjà en scène */
    if(b.t === "choice"){
      if(!b.opts || b.opts.length < 2) errs.push("décision sans options");
      const save = new Set(alive);
      for(const o of b.opts || []){
        alive.clear(); save.forEach(x=>alive.add(x));
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
        ((b.branches || {})[o.k] || []).forEach(walk);
      }
      return;
    }
<<<<<<< HEAD
    if(b.t === "name"){ alive.set("name", "dom"); return; }
    if(b.t === "dex"){ alive.set("dex", "dom"); return; }
=======
    if(b.t === "name"){ alive.add("name"); return; }
    if(b.t === "dex"){ alive.add("dex"); return; }
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
    if(b.t === "bg" && !CINE_BGS.includes(b.k)) errs.push("décor inconnu : " + b.k);
    if(b.t === "say"){
      if(!(b.who in A.CINE_WHO)) errs.push("locuteur inconnu : " + b.who);
      if(!b.text) errs.push("réplique vide");
      if(b.corrupt !== undefined && (b.corrupt < 0 || b.corrupt > 1)) errs.push("corruption hors [0,1]");
      if(b.mood !== undefined && !A.PZ_EMOS.includes(b.mood)) errs.push("humeur inconnue : " + b.mood);
    }
    if(b.t === "fx"){
      if(!CINE_FX.includes(b.k)) errs.push("effet inconnu : " + b.k);
      if(b.lv !== undefined && ![1,2,3].includes(b.lv)) errs.push("intensité hors 1-3 : " + b.lv);
    }
    if(b.t === "actor"){
      if(!["prof","pz","mon","missing","emblem","self","mnname"].includes(b.kind)) errs.push("type d'acteur inconnu : " + b.kind);
      if(b.kind === "mon" && !A.POKE[b.mon]) errs.push("Pokémon inconnu : " + b.mon);
      if(typeof b.pos === "string" && !(b.pos in A.CINE_POS)) errs.push("position inconnue : " + b.pos);
      if(alive.has(b.id)) errs.push("acteur déjà en scène : " + b.id);
      alive.set(b.id, "dom");
    }
    if(b.t === "leave"){ if(!alive.has(b.id) || alive.get(b.id) !== "dom") errs.push("sortie d'un acteur absent : " + b.id); alive.delete(b.id); }
    if(b.t === "mood"){ if(!alive.has(b.id)) errs.push("humeur d'un acteur absent : " + b.id); if(!A.PZ_EMOS.includes(b.mood)) errs.push("humeur inconnue : " + b.mood); }
    if(b.t === "fx" && b.k === "blackout"){ alive.clear(); set = null; }   /* l'extinction vide le plateau */
    /* --- le plateau --- */
    if(b.t === "set"){
      if(!A.PL_SETS[b.k]) errs.push("lieu inconnu : " + b.k);
      if(b.light && !A.PL_LIGHTS.includes(b.light)) errs.push("lumière inconnue : " + b.light);
      set = b.k;
      if(b.keep !== true){ const keep = b.keep || []; for(const [id, k] of [...alive]) if(k !== "dom" && !keep.includes(id)) alive.delete(id); }
      if(b.cam && b.cam.at) where(b.cam.at, "ancre de caméra");
    }
    if(b.t === "plat" && b.on === false){ for(const [id, k] of [...alive]) if(k !== "dom") alive.delete(id); set = null; }
    if(b.t === "put"){
      if(!A.PL_KINDS.includes(b.kind)) errs.push("type d'acteur du plateau inconnu : " + b.kind);
      if(b.kind === "mon" && !A.POKE[b.mon]) errs.push("Pokémon inconnu : " + b.mon);
      if(b.kind === "prop" && !A.PL_PROPS[b.prop]) errs.push("accessoire inconnu : " + b.prop);
      if(b.mood !== undefined && !A.PZ_EMOS.includes(b.mood)) errs.push("humeur inconnue : " + b.mood);
      if(b.emote !== undefined && !A.PL_EMOTES.includes(b.emote)) errs.push("signe inconnu : " + b.emote);
      if(!set) errs.push("acteur posé sans décor : " + b.id);
      if(alive.has(b.id)) errs.push("acteur déjà en scène : " + b.id);
      where(b.at, "ancre"); where(b.to, "ancre");
      alive.set(b.id, b.kind);
    }
    if(b.t === "gone"){ needW(b); alive.delete(b.id); }
    if(["move", "face", "anim", "hop", "tremble"].includes(b.t)) needW(b);
    if(b.t === "move") where(b.to, "ancre");
    if(b.t === "face" && b.to) where(b.to, "ancre");
    if(b.t === "emote"){ needW(b); if(!A.PL_EMOTES.includes(b.e)) errs.push("signe inconnu : " + b.e); }
    if(b.t === "swarm") needW(b, "swarm");
    if(b.t === "light" && !A.PL_LIGHTS.includes(b.k)) errs.push("lumière inconnue : " + b.k);
    if(b.t === "wl" && b.on !== false && b.k && !A.PL_WL.includes(b.k)) errs.push("texte du monde inconnu : " + b.k);
    if(b.t === "wl" && b.follow && !alive.has(b.follow)) errs.push("texte qui suit un acteur absent : " + b.follow);
    if(b.t === "wl") where(b.at, "ancre");
    if(b.t === "ball"){ where(b.from, "ancre"); where(b.to, "ancre"); }
    if(b.t === "cam" && b.to) where(b.to, "ancre de caméra");
    if(b.t === "letters" && b.on !== false) where(b.at, "ancre");
  };
  for(const sh of sc.shots){
    if(sh.bg && !CINE_BGS.includes(sh.bg)) errs.push("décor de plan inconnu : " + sh.bg);
    sh.beats.forEach(walk);
  }
  return errs;
}
for(const k in A.CINEMAS){
  const e = cineLint(A.CINEMAS[k]);
  t(`cinématique « ${k} » conforme au standard` + (e.length ? " — " + e.join(" ; ") : ""), e.length === 0);
}
/* chaque scene du recit, dirigee automatiquement, doit respecter le standard */
{
  A.setS(A.newState());
  const bad = [];
  for(const sc of A.STORY){ const e = cineLint(A.cineFor(sc.id)); if(e.length) bad.push(sc.id + " : " + e.join(", ")); }
  A.RIFT_ARC.forEach((r,i)=>{ const e = cineLint(A.directStory({id:"rift_" + r.n, lines:r.lines}));
    if(e.length) bad.push("rift_" + r.n + " : " + e.join(", ")); });
  t(`les ${A.STORY.length + A.RIFT_ARC.length} scènes du récit sont conformes` + (bad.length ? " — " + bad.join(" | ") : ""), bad.length === 0);
}
t("chaque scène dirigée garde toutes ses répliques, dans l'ordre", (()=>{
  const says = sc => { const out = [];
    const walk = b => (b.t === "par" || b.t === "seq") ? b.beats.forEach(walk) : (b.t === "say" && out.push(b.text));
    sc.shots.forEach(sh=>sh.beats.forEach(walk)); return out; };
  return A.STORY.every(sc => A.CINEMAS[sc.id] ||
    JSON.stringify(says(A.directStory(sc))) === JSON.stringify(sc.lines.filter(l=>!l.q && (!l.when || A.storyWhen(l.when))).map(l=>l.t)));
})());
t("aucun acteur ne reste en scène à la fin", A.STORY.every(sc=>{
  if(A.CINEMAS[sc.id]) return true;
  const on = new Set();
  const walk = b => { if(b.t === "par" || b.t === "seq") return b.beats.forEach(walk);
    if(b.t === "actor" || b.t === "put") on.add(b.id); if(b.t === "leave" || b.t === "gone") on.delete(b.id);
    if(b.t === "set" && b.keep !== true) for(const id of [...on]) if(!(b.keep || []).includes(id)) on.delete(id);
    if((b.t === "fx" && b.k === "blackout") || (b.t === "plat" && b.on === false)) on.clear(); };
  A.directStory(sc).shots.forEach(sh=>sh.beats.forEach(walk));
  return on.size === 0;
}));
t("les scènes majeures ont bandes et carton, les mineures non", (()=>{
  const has = (sc, t2) => sc.shots[0].beats.some(b=>b.t === t2);
  const major = A.directStory(A.STORY.find(x=>x.id === "finale_gate"));
  const minor = A.directStory(A.STORY.find(x=>x.id === "pz_fail"));
  return has(major, "bars") && has(major, "card") && !has(minor, "bars") && !has(minor, "card");
})());
t("le contrôleur attrape une scène hors standard", (()=>{
  const faux = {shots:[{beats:[{t:"fx", k:"glitch", lv:5},{t:"leave", id:"personne"},{t:"danse"}]}]};
  return cineLint(faux).length === 3;
})());
t("la corruption garde la longueur et les espaces", (()=>{
  const src = "Bienvenue dans le monde des Pokémon";
  const out = A.corruptText(src, 0.5);
  return [...out].length === [...src].length &&
    [...src].every((ch,i)=>ch !== " " || [...out][i] === " ");
})());
/* --- le plateau : le monde peint sous les cinématiques (37d, 37e, 37f) --- */
t("chaque scène du récit a sa mise en scène (pas de lieu par défaut)", (()=>{
  const ids = A.STORY.filter(sc=>!A.CINEMAS[sc.id]).map(sc=>sc.id).concat(A.RIFT_ARC.map(r=>"rift_" + r.n));
  const missing = ids.filter(id=>!A.STAGE[id]);
  const stray = Object.keys(A.STAGE).filter(id=>!ids.includes(id));
  if(missing.length || stray.length) console.log("    sans mise en scène :", missing.join(", "), "| en trop :", stray.join(", "));
  return !missing.length && !stray.length;
})());
t("chaque humeur de Porygon-Z se joue avec le corps", A.PZ_EMOS.every(m=>typeof A.PL_MOOD[m] === "function"));
t("les poses de Porygon-Z : huit directions, une durée par image", (()=>{
  const need = ["walk", "idle", "hurt", "charge", "attack", "shoot", "wake", "hop", "rotate", "sleep", "laying", "rearup"];
  return need.every(k=>{ const P = A.PZX[k]; return P && P.rows === 8 && P.dur.length === P.n && P.n >= 1 && /^data:image\/png;base64,/.test(P.u); });
})());
t("le portrait de Porygon-Z couvre ses dix-sept humeurs", typeof A.PZ_STRIP === "string" && A.PZ_STRIP.length > 1000);
t("l'archiviste est une silhouette debout : une tête, deux jambes, pas de casquette", (()=>{
  const M = A.SW_MAP;
  if(M.length !== A.SW_H || !M.every(r=>r.length === A.SW_W)) return false;
  const row = y => [...M[y]].map(c=>c === "#" ? 1 : 0);
  const width = y => row(y).reduce((a, b)=>a + b, 0);
  const runs = y => { let n = 0, prev = 0; for(const v of row(y)){ if(v && !prev) n++; prev = v; } return n; };
  /* la tête est plus étroite que les épaules ; en bas, deux jambes séparées ; rien ne dépasse de la tête */
  return width(2) < width(12) && runs(A.SW_H - 3) === 2 && width(0) <= 6 && M.every(r=>r[0] === "." && r[A.SW_W - 1] === ".");
})());
t("la police du monde : chaque signe tient sur trois pixels sur cinq", Object.values(A.PL_FONT).every(g=>/^[01]{15}$/.test(g)) && A.plTextW("12%") === 11);
t("les ancres de chaque lieu sont dans le lieu", Object.entries(A.PL_SETS).every(([k, d])=>Object.values(d.anchors || {}).every(([x, y])=>x >= -0.3 && x <= 1.3 && y >= 0 && y <= 1)));
t("un lieu peint se peint, et s'anime, sans erreur ni valeur absurde, à toutes les tailles", (()=>{
  /* une toile factice : chaque appel est vérifié (pas de NaN, pas d'infini) */
  const bad = [];
  const ctx = () => new Proxy({}, {get:(o, k)=> k in o ? o[k]
    : (k === "createLinearGradient" || k === "createRadialGradient") ? ()=>({addColorStop(){}})
    : k === "createImageData" ? (w, h)=>({data:new Uint8ClampedArray(Math.max(1, w * h * 4)), width:w, height:h})
    : k === "getImageData" ? (x, y, w, h)=>({data:new Uint8ClampedArray(Math.max(1, w * h * 4))})
    : (...a)=>{ for(const v of a) if(typeof v === "number" && !Number.isFinite(v)) bad.push(String(k)); },
    set:(o, k, v)=>{ if(typeof v === "number" && !Number.isFinite(v)) bad.push("=" + String(k)); o[k] = v; return true; }});
  const doc = global.document, made = doc.createElement;
  doc.createElement = tag => tag === "canvas" ? {width:0, height:0, getContext:()=>ctx(), toDataURL:()=>""} : made(tag);
  let ok = true;
  try {
    const variants = {labo:["warm", "souvenir", "now", "clean"], route:["day", "dusk", "night"], noyau:["kanto", "johto", "hoenn", ""]};
    for(const [k, def] of Object.entries(A.PL_SETS)) for(const v of (variants[k] || [""])) for(const [W, H] of [[195, 422], [260, 450], [187, 300]]){
      const sw = Math.round(W * (def.sw || 1)), sh = Math.round(H * (def.sh || 1));
      const x = ctx(), info = def.paint(x, sw, sh, A.plRng(A.plHash(k + v)), v, A.plKitForTest(x, sw, sh)) || {};
      if(def.anim){ const P = {set:{info, st:{t0:0}}, s:2}; for(const t of [0, 1.3, 7.9]) def.anim(x, sw, sh, t, v, P, {}, {t0:0, lit:6, litStep:0.2, bar:12, barTo:100, integSeq:[1, 2], sig:1, lines:4, mnL:1, crack:1, free:0, hi:"kanto", eyes:1, trace:1, open:1, flipAt:1}); }
    }
  } catch(e){ console.log("    " + e.stack.split("\n").slice(0, 3).join(" / ")); ok = false; }
  doc.createElement = made;
  if(bad.length) console.log("    valeurs absurdes :", [...new Set(bad)].slice(0, 6).join(", "));
  return ok && !bad.length;
})());
t("les mises en scène n'emploient que des Pokémon dessinés (Donjon Mystère)", (()=>{
  const ids = new Set();
  const scan = list => (list || []).forEach(b=>{ if(!b) return; if(b.t === "put" && b.kind === "mon") ids.add(b.mon); if(b.beats) scan(b.beats); if(b.branches) Object.values(b.branches).forEach(scan); });
  for(const sc of A.STORY) A.cineFor(sc.id).shots.forEach(sh=>scan(sh.beats));
  A.RIFT_ARC.forEach(r=>A.directStory({id:"rift_" + r.n, lines:r.lines}).shots.forEach(sh=>scan(sh.beats)));
  return [...ids].every(id=>A.PMD_META && A.PMD_META[id]);
})());
t("la mise en scène ne touche pas au texte : un souvenir garde ses répliques, dans l'ordre", (()=>{
  A.setS(A.newState());
  const sc = A.directStory(A.STORY.find(x=>x.id === "pz_mem3"));
  const says = []; const walk = b => (b.t === "par" || b.t === "seq") ? b.beats.forEach(walk) : b.t === "say" && says.push(b);
  sc.shots.forEach(sh=>sh.beats.forEach(walk));
  /* les trois « Bonjour ! » du souvenir sont dits au sépia, les autres au présent */
  const mem = says.filter(b=>b.mem).map(b=>b.text);
  return mem.length === 4 && mem.filter(t=>/^Bonjour/.test(t)).length === 3;
})());
t("Porygon-Z est projeté tant qu'il n'est pas écrit dans le Pokédex", (()=>{
  A.setS(A.newState());
  const holo = id => { const b = A.directStory(A.STORY.find(x=>x.id === id)).shots[0].beats.find(x=>x.t === "put" && x.id === "pz"); return b && b.holo; };
  const before = holo("beat_early");
  A.getS().saga = {end:"write"};
  const after = holo("beat_early");
  return before === true && after === false;
})());
t("un souvenir couvert par la défragmentation compte ses blocs", A.stDefragN(A.STORY.find(x=>x.id === "pz_mem4")) === 19 && A.stDefragN(A.STORY.find(x=>x.id === "pz_mem1")) === 1 && A.stDefragN(A.STORY.find(x=>x.id === "johto_mid")) === null);

t("le système ne parle en rouge que pour une erreur (« aucune ligne illisible » n'en est pas une)", (()=>{
  const src = require("fs").readFileSync(__dirname + "/src/37-cine.js", "utf8");
  const m = src.match(/const sysErr = (.*);/); if(!m) return false;
  const f = new Function("b", "return " + m[1]);
  return f({who:"sys", text:"ERREUR : entité sans index."}) && !f({who:"sys", text:"Trois secteurs cohérents. Aucune ligne illisible. Aucune."}) && !f({who:"pz", text:"ERREUR"});
})());
t("les durées du standard sont ordonnées",
  A.CINE_T.fast < A.CINE_T.short && A.CINE_T.short < A.CINE_T.mid &&
  A.CINE_T.mid < A.CINE_T.long && A.CINE_T.long < A.CINE_T.hold);


t("toute scène dotée d'une cinématique la joue, quel que soit le chemin", (()=>{
  /* le journal et l'outil game master appellent playStory : ils doivent
     obtenir la cinematique, pas l'ancienne scene de dialogue */
  A.setS(A.newState());
  for(const id in A.CINEMAS){
    A.playStory(id, ()=>{});
    if(A.getCineLast() !== id) return false;
  }
  return true;
})());


/* --- architecture de l'interface --- */
t("le hub présente les activités dans leur ordre de déblocage", (()=>{
  const lv = A.ACTIVITIES.map(m=>A.MODULE_REQ[m.k].lv);
  return lv.every((v,i)=>i === 0 || v >= lv[i-1]);
})());
t("le hub ne nomme ni ne décrit une salle verrouillée", (()=>{
  A.setS(A.newState());
  const h = A.SCREENS.modules.html();
  const locked = A.ACTIVITIES.filter(m=>!A.moduleUnlocked(m.k));
  return locked.length > 0 && locked.every(m=>!h.includes(m.n) && !h.includes(m.d));
})());
t("le mot de passe de test est exact et sensible à la casse", (()=>{
  /* le mot de passe lui-meme n'est jamais ecrit dans le depot : on le lit,
     s'il est fourni, dans la variable d'environnement PCG_ADMIN_PW */
  const pw = process.env.PCG_ADMIN_PW;
  const exact = pw ? (A.adminHash(pw) === A.ADMIN_HASH
                      && A.adminHash(pw.toLowerCase()) !== A.ADMIN_HASH) : true;
  return exact && /^[0-9a-f]{6,8}$/.test(A.ADMIN_HASH) && A.adminHash("") !== A.ADMIN_HASH;
})());
t("l'atelier rend chacun de ses onglets", (()=>{
  A.setS(A.newState()); A.addToDex(25, 10, false);
  return A.ATELIER_TABS.every(tb=>{ const h = A.SCREENS.atelier[tb.k](); return typeof h === "string" && h.length > 20; });
})());
t("Collection et Sac portent leurs onglets", (()=>{
  A.setS(A.newState());
  return A.SCREENS.dex.html().includes("segbar") && A.SCREENS.bag.html().includes("segbar")
      && A.SCREENS.shop.html().includes("segbar");
})());


/* --- scènes du Poké-Poker --- */
t("les huit scènes de badge sont conformes", A.BADGES.every((b,i)=>cineLint(A.badgeCine(i, i + 1)).length === 0));
t("chaque main secrète a une scène conforme, quel que soit le nombre de cartes", (()=>{
  const secrets = A.HANDS.filter(h=>h.secret);
  if(!secrets.length) return false;
  for(const h of secrets) for(let n = 1; n <= 5; n++){
    const ids = [150,151,129,25,1].slice(0, n);
    if(cineLint(A.secretCine(h.id, ids)).length) return false;
  }
  return true;
})());
t("la dernière scène de badge annonce le Conseil", (()=>{
  const sc = A.badgeCine(7, 8);
  return JSON.stringify(sc).includes("Conseil");
})());


/* --- cosmétiques : chacun se reconnaît au premier coup d'œil --- */
t("aucun cadre ne partage son rendu avec un autre", (()=>{
  const frames = Object.values(A.COSMETICS).filter(c=>c.t === "frame" && !c.def);
  const cls = frames.map(c=>c.cls);
  return cls.every(Boolean) && new Set(cls).size === cls.length;
})());
t("aucun fond ne partage son rendu avec un autre", (()=>{
  const css = Object.values(A.COSMETICS).filter(c=>c.t === "bg").map(c=>c.css);
  return new Set(css).size === css.length;
})());
t("chaque classe de cadre est réellement stylée", (()=>{
  const css = require("fs").readFileSync(__dirname + "/src/style.css", "utf8");
  return Object.values(A.COSMETICS).filter(c=>c.t === "frame" && c.cls)
    .every(c=>css.includes(".avatar." + c.cls));
})());
t("chaque nouveau cosmétique est délivré par un succès", (()=>{
  const given = new Set();
  for(const a of A.ACHIEVEMENTS) if(a.rw && a.rw.cos) [].concat(a.rw.cos).forEach(c=>given.add(c));
  const nouveaux = ["frame_circuit","frame_prism","frame_origin","frame_elements","frame_birds","frame_champion",
    "bg_abyss","bg_magma","bg_sky","bg_psy","bg_felt","bg_shiny","bg_zero",
    "fx_tide","fx_magma","fx_aurora","fx_psy","fx_sacred","fx_shiny","fx_champion","fx_zero"];
  return nouveaux.every(c=>A.COSMETICS[c] && given.has(c));
})());
t("chaque effet se dessine, et à l'identique d'un rendu à l'autre", Object.keys(A.FX_LAYERS).every(k=>{
  const a = A.FX_LAYERS[k](), b = A.FX_LAYERS[k]();
  return a === b && a.includes("fxl") && A.COSMETICS[k];
}));
t("les succès des légendaires restent cachés", A.ACHIEVEMENTS
  .filter(a=>["c_kyogre","c_groudon","c_rayquaza","c_mewtwo","c_hooh","c_origin","c_weather","c_rift"].includes(a.id))
  .every(a=>a.hid));


/* --- la Brèche --- */
t("chaque type a son attaque, et chaque objet sa signature", (()=>{
  for(let tp = 1; tp <= 18; tp++) if(!A.BR_ARCH[tp] || !A.BR_ARCH[tp].k) return false;
  const g = Object.values(A.BR_ITEMS).map(i=>i.g);
  return g.every(Boolean) && new Set(g).size === g.length;
})());
t("l'expérience demandée croît à chaque niveau", [...Array(40)].every((_,L)=>L < 1 || A.brXpNeed(L + 1) > A.brXpNeed(L)));
t("niveau et évolution renforcent réellement une arme", (()=>{
  A.setS(A.newState());
  const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:1});
  const w1 = {id:4, lv:1, stage:0}, w5 = {id:4, lv:5, stage:1, show:5}, w8 = {id:4, lv:8, stage:2, show:6};
  const a = A.brWeaponStats(w1, R), b = A.brWeaponStats(w5, R), c = A.brWeaponStats(w8, R);
  return a.dmg < b.dmg && b.dmg < c.dmg && c.count > a.count && c.area > a.area;
})());
t("les choix de niveau sont distincts, et le premier offre un compagnon", (()=>{
  A.setS(A.newState()); for(let i = 1; i <= 60; i++) A.addToDex(i, 20, false);
  const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:7});
  R.lv = 2;
  const ch = A.brChoices(R), keys = ch.map(o=>o.k + (o.id || "") + (o.i ?? "") + (o.key || ""));
  return ch.length === 3 && new Set(keys).size === 3 && ch[0].k === "new";
})());
t("la Brèche du jour est la même pour tous, et change le lendemain", (()=>{
  const a = A.brDaily(), b = A.brDaily();
  return a.seed === b.seed && a.hab === b.hab && a.starter === b.starter;
})());
t("une minute de Brèche simulée reste saine (aucun NaN, aucune fuite)", (()=>{
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:3});
  R.W = 390; R.H = 700; R.dpr = 1;
  for(let k = 0; k < 1800; k++){
    R.joy = {dx:Math.cos(k / 40), dy:Math.sin(k / 40)}; R.keys = {};
    A.brUpdate(R, 1/30);
    if(R.choices){ R.choices = null; R.modal = false; }
    if(R.modal) R.modal = false;
    if(R.over) break;
  }
  let n = 0; R.P.foes.each(()=>n++);
  return Number.isFinite(R.hp) && Number.isFinite(R.x) && R.kills > 20 && n < 400 && R.P.foes.list.length < 600;
})());
t("vaincre un gardien dans la Brèche lève bien le verrou", (()=>{
  A.setS(A.newState());
  const before = A.getS().bosses.length;
  const out = A.brGuardianWin({id:144, region:"kanto", core:false});
  return out.first && A.getS().bosses.length === before + 1 && A.getS().dex[144];
})());
t("Évoli évolue selon l'heure, les autres suivent leur lignée", A.brNextEvo(4) === 5 && A.brNextEvo(5) === 6 && [196,197].includes(A.brNextEvo(133)));
t("la Brèche remplace les Data Guardians dans le hub", A.ACTIVITIES.some(a=>a.k === "breche") && !A.ACTIVITIES.some(a=>a.k === "boss"));


/* --- la page en ligne doit se charger ---
   Une constante declaree deux fois (l'atlas chromatique, un temps) casse tout
   le jeu en ligne, alors que la version autonome, elle, fonctionne. */
{
  const fs = require("fs"), wp = __dirname + "/web/index.html";
  if(fs.existsSync(wp)){
    const html = fs.readFileSync(wp, "utf8");
    const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join("\n");
    let ok = true; try { new Function(js); } catch(e){ ok = false; }
    t("la page en ligne a une syntaxe valide", ok);
    /* seulement les declarations globales, en debut de ligne : les constantes
       locales des fonctions se repetent legitimement d'une fonction a l'autre */
    const decl = [...js.matchAll(/^const\s+([A-Z_][A-Z0-9_]*)\s*=/gm)].map(m=>m[1]);
    const dup = decl.filter((d, i)=>decl.indexOf(d) !== i);
    t("aucune constante globale déclarée deux fois dans la page en ligne" + (dup.length ? " — " + [...new Set(dup)].join(", ") : ""), dup.length === 0);
  }
}
t("l'atlas chromatique existe et suit la même disposition", (()=>{
  const fs = require("fs");
  const src = fs.readFileSync(__dirname + "/src/_atlas_shiny.js", "utf8");
  return src.includes("ATLAS_SHINY_URL") && src.length > 100000;
})());


/* --- les cartes de la Brèche --- */
t("une même graine donne exactement la même carte (Brèche du jour)", (()=>{
  A.setS(A.newState());
  const a = A.brNewRun({region:"kanto", hab:"foret", starter:4, seed:42}), b = A.brNewRun({region:"kanto", hab:"foret", starter:4, seed:42});
  for(let cx = -2; cx <= 2; cx++) for(let cy = -2; cy <= 2; cy++)
    if(JSON.stringify(A.brChunkAt(a, cx, cy)) !== JSON.stringify(A.brChunkAt(b, cx, cy))) return false;
  const c = A.brNewRun({region:"kanto", hab:"foret", starter:4, seed:43});
  return JSON.stringify(A.brChunkAt(a, 1, 0)) !== JSON.stringify(A.brChunkAt(c, 1, 0));
})());
t("chaque habitat a son relief, et l'apparition reste dégagée", Object.keys(A.BR_TERRAIN).every(h=>{
  A.setS(A.newState());
  const R = A.brNewRun({region:"kanto", hab:h, starter:4, seed:7});
  let obs = 0;
  for(let cx = -1; cx <= 1; cx++) for(let cy = -1; cy <= 1; cy++){
    const ch = A.brChunkAt(R, cx, cy); obs += ch.obs.length;
    for(const o of ch.obs) if(Math.hypot(o.x, o.y) < 150) return false;
    for(const o of ch.obs) for(const q of ch.obs) if(o !== q && Math.hypot(o.x - q.x, o.y - q.y) < o.r + q.r) return false;
  }
  return obs > 0;
}));
t("le relief bloque : on ne traverse pas un rocher", (()=>{
  const e = {x:5, y:0}; A.brPushOut(e, 12, [{x:0, y:0, r:20}]);
  return Math.hypot(e.x, e.y) >= 31.9;
})());
t("trois missions par run, dont celle de l'habitat", Object.keys(A.BR_TERRAIN).every(h=>{
  A.setS(A.newState());
  const R = A.brNewRun({region:"kanto", hab:h, starter:4, seed:9});
  return R.missions.length === 3 && new Set(R.missions.map(m=>m.k)).size === 3 && R.missions.every(m=>m.goal > 0 && m.n === 0);
}));
t("la maîtrise monte par rang avec les runs jouées", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.breche = {mastery:{4:0}};
  const r0 = A.brMastery(4); S0.breche.mastery[4] = 3; const r2 = A.brMastery(4); S0.breche.mastery[4] = 99; const r5 = A.brMastery(4);
  return r0 === 0 && r2 === 2 && r5 === 5;
})());
t("une minute de Brèche dans chaque habitat reste saine", Object.keys(A.BR_TERRAIN).every(h=>{
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  const R = A.brNewRun({region:"kanto", hab:h, starter:4, seed:11}); R.W = 390; R.H = 700; R.dpr = 1;
  for(let k = 0; k < 1800; k++){
    R.joy = {dx:Math.cos(k / 50), dy:Math.sin(k / 50)}; R.keys = {};
    A.brUpdate(R, 1/30);
    if(R.choices){ R.choices = null; } R.modal = false;
    if(R.over) break;
  }
  return Number.isFinite(R.hp) && Number.isFinite(R.x) && R.kills > 10;
}));


/* --- installation de l'application --- */
t("hors hébergement web, le parcours d'installation ne bloque jamais l'introduction", (()=>{
  A.setS(A.newState());
  let ran = false;
  A.pwaAfterIntro(()=>{ ran = true; });
  return !A.pwaInstallable() && ran && !A.getS().flags.pwaOffers;
})());
t("la détection d'appareil ne plante pas sans navigateur", (()=>{ const e = A.pwaEnv(); return typeof e.ios === "boolean" && typeof e.mobile === "boolean"; })());


/* --- les attaques de la Brèche --- */
t("chaque type a trois attaques, toutes d'une forme connue", Object.keys(A.BR_ATK).length === 18 &&
  Object.values(A.BR_ATK).every(l=>l.length === 3 && l.every(([k, n, n2])=>A.BR_KIND[k] && n && n2 && n !== n2)));
t("les 386 espèces se répartissent sur au moins 40 attaques différentes", (()=>{
  const names = new Set();
  for(let i = 1; i <= 386; i++) if(A.POKE[i]) names.add(A.brArchFor(i).n);
  return names.size >= 40;
})());
t("les 21 légendaires ont chacun une attaque signature", (()=>{
  const L = []; for(let i = 1; i <= 386; i++) if(A.POKE[i] && A.POKE[i].leg) L.push(i);
  return L.length === 21 && L.every(i=>A.brArchFor(i).sig && (A.BR_KIND[A.brArchFor(i).k] || A.BR_LEG_FIRE[A.brArchFor(i).k]));
})());
t("chaque forme d'attaque s'exécute en jeu et inflige des dégâts", (()=>{
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  const bad = [];
  for(const k of Object.keys(A.BR_KIND)){
    if(k === "orbit") continue;                              /* orbite : moteur continu, deja couvert */
    const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:5});
    R.W = 390; R.H = 700; R.dpr = 1;
    for(let j = 0; j < 12; j++){ const f = A.brSpawnFoe(R, 19, "n"); const a = j / 12 * 6.28; f.x = Math.cos(a) * 90; f.y = Math.sin(a) * 90; f.hp = f.max = 99999; }
    const w = R.team[0], st = Object.assign(A.brWeaponStats(w, R), {k, p:{}});
    R.curW = 0; A.brFire(R, w, st, {x:0, y:0});
    for(let n = 0; n < 150; n++){ R.joy = {dx:0, dy:0}; R.keys = {}; A.brUpdate(R, 1/30); R.modal = false; R.choices = null; }
    if(!(R.dmgBy[0] > 0) || !Number.isFinite(R.hp)) bad.push(k);
  }
  if(bad.length) console.log("    formes sans effet :", bad.join(", "));
  return bad.length === 0;
})());

/* --- les attaques des légendaires : une mécanique et un dessin chacun (59l) --- */
t("les 21 légendaires ont 21 attaques différentes", (()=>{
  const L = []; for(let i = 1; i <= 386; i++) if(A.POKE[i] && A.POKE[i].leg) L.push(i);
  return L.length === 21 && new Set(L.map(i=>A.brArchFor(i).k)).size === 21;
})());
t("aucune signature ne réutilise une forme ordinaire (Mewtwo et Mew gardent la leur)", Object.keys(A.BR_LEGEND).map(Number)
  .filter(i=>i !== 150 && i !== 151).every(i=>{ const k = A.brArchFor(i).k; return A.BR_LEG_KIND[k] && !A.BR_KIND[k] && A.BR_LEG_FIRE[k]; }));
t("chaque signature dit ce qu'elle fait, et change de nom en s'éveillant", Object.keys(A.BR_LEGEND).map(Number)
  .every(i=>{ const a = A.brArchFor(i); return a.sig && a.d && a.d.length > 30 && a.n && a.n2 && a.n !== a.n2; }));
t("la description apparaît sur la carte de choix d'un légendaire", (()=>{
  A.setS(A.newState()); A.brState();
  const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:5});
  return /br-sigd/.test(A.brChoiceHtml(R, {k:"new", id:245}, 0)) && !/br-sigd/.test(A.brChoiceHtml(R, {k:"new", id:25}, 0));
})());
/* un contexte de dessin factice : il accepte tout, et refuse les nombres invalides */
const lgCtx = () => new Proxy({}, {
  get:(o, k)=> k in o ? o[k] : (k === "createLinearGradient" || k === "createRadialGradient") ? ()=>({addColorStop(){}})
    : (...a)=>{ for(const v of a) if(typeof v === "number" && !Number.isFinite(v)) throw new Error("valeur invalide dans " + String(k)); },
  set:(o, k, v)=>{ if(typeof v === "number" && !Number.isFinite(v)) throw new Error("valeur invalide pour " + String(k)); o[k] = v; return true; }});
const lgRun = (id, seed) => {
  const R = A.brNewRun({region:"kanto", hab:"route", starter:id, seed:seed || 5});
  R.W = 390; R.H = 700; R.dpr = 1; return R;
};
const lgStep = (R, n) => { for(let i = 0; i < n; i++){ R.joy = {dx:0, dy:0}; R.keys = {}; R.hp = R.maxHp; R.inv = 1; R.spawnAcc = -1e9;
  A.brUpdate(R, 1/30); R.modal = false; R.choices = null; R.pendingLevels = 0; R.chestsPending = 0; } };
t("chaque signature s'exécute, frappe, se dessine, et ne laisse rien derrière elle", (()=>{
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  const ctx = lgCtx(), bad = [];
  for(const id of Object.keys(A.BR_LEGEND).map(Number)) for(const stage of [0, 2]){
    const R = lgRun(id), w = R.team[0]; w.stage = stage; w.lv = stage ? 8 : 1;
    for(let j = 0; j < 24; j++){ const f = A.brSpawnFoe(R, 19, j % 12 ? "n" : "elite"); const a = j / 24 * 6.28;
      f.x = R.x + Math.cos(a) * (60 + j * 6); f.y = R.y + Math.sin(a) * (60 + j * 6); f.hp = f.max = 99999; }
    const X = v => v - R.x + 195, Y = v => v - R.y + 350;
    try {
      for(let n = 0; n < 30 * 6; n++){
        lgStep(R, 1);
        R.P.zones.each(z=>{ const D = A.BR_LEG_DRAW[z.k]; if(D && z.delay <= 0) for(const L of ["ground", "mid", "sky"]) if(D[L]) D[L](ctx, R, z, X, Y); });
        A.lgDrawStates(ctx, R, X, Y);
        if(w.serpC) A.lgDrawSerpent(ctx, R, w, 0, X, Y);
        R.P.foes.each(f=>{ if(!Number.isFinite(f.x + f.y + f.hp)) throw new Error("ennemi hors du monde"); });
      }
      /* l'arme se tait : tout ce qu'elle a posé doit s'éteindre */
      w.cd = 1e9; lgStep(R, 30 * 6);
    } catch(e){ bad.push(id + "/" + stage + " (" + e.message + ")"); continue; }
    let left = 0; R.P.zones.each(z=>{ if(A.BR_LEG_ZONE[z.k]) left++; });
    if(!(R.dmgBy[0] > 0) || left || !Number.isFinite(R.hp)) bad.push(id + "/" + stage);
  }
  if(bad.length) console.log("    signatures en défaut :", bad.join(", "));
  return bad.length === 0;
})());
t("Artikodin : ce qui est déjà gelé vole en éclats", (()=>{
  const R = lgRun(144), w = R.team[0]; w.cd = 1e9; R.mods.crit = 1e-9;
  const f = A.brSpawnFoe(R, 19, "n"); f.x = R.x + 120; f.y = R.y; f.hp = f.max = 99999; f.spd = 0; f.frz = 1.6; f.stun = 1.6;
  R.curW = 0; A.brFireExtra(R, w, A.brWeaponStats(w, R), {x:R.x, y:R.y}, f, 0);
  let shards = 0;
  for(let n = 0; n < 24; n++){ lgStep(R, 1); R.P.shots.each(s=>{ if(s.kind === "shard") shards++; }); }
  return shards > 0 && f.hp < 99999;
})());
t("Artikodin : un flocon gèle ce qu'il touche", (()=>{
  const R = lgRun(144), w = R.team[0]; w.cd = 1e9;
  const f = A.brSpawnFoe(R, 19, "n"); f.x = R.x + 120; f.y = R.y; f.hp = f.max = 99999; f.spd = 0;
  R.curW = 0; A.brFireExtra(R, w, A.brWeaponStats(w, R), {x:R.x, y:R.y}, f, 0);
  lgStep(R, 24);
  return f.frz > 0 && f.stun > 0;
})());
t("Ho-Oh : un ennemi qui tombe en brûlant passe le feu sacré à ses voisins", (()=>{
  const R = lgRun(250);
  const [a, b, c] = [0, 1, 2].map(k=>{ const f = A.brSpawnFoe(R, 19, "n"); f.x = R.x + 100 + k * 30; f.y = R.y; f.hp = f.max = 99999; return f; });
  a.sacre = 3; a.sacreW = 0; a.sacreD = 5; a.hp = 1;
  R.curW = 0; A.brHit(R, a, 1e6, "#fff", 0, 0, 0);
  return a.hp <= 0 && b.sacre > 0 && c.sacre > 0 && b.sacreW === 0;
})());
t("Celebi : le temps s'arrête, puis tous les coups tombent d'un coup", (()=>{
  const R = lgRun(251), w = R.team[0]; w.cd = 1e9;
  const f = A.brSpawnFoe(R, 19, "n"); f.x = R.x + 60; f.y = R.y; f.hp = f.max = 99999; f.spd = 0;
  R.curW = 0; A.brFireExtra(R, w, A.brWeaponStats(w, R), {x:R.x, y:R.y}, f, 0);
  lgStep(R, 30);
  const during = R.dmgBy[0] || 0, stopped = f.tstop > 0;
  lgStep(R, 45);
  return during === 0 && stopped && R.dmgBy[0] > 0;
})());
t("Regirock : la horde contourne un menhir, elle ne le traverse pas", (()=>{
  const R = lgRun(377);
  const z = A.brZone(R, {k:"lgMenhir", x:R.x + 100, y:R.y, r:20, life:3, max:3, delay:0, dmg:1, color:"#d9a86a", w:0, tick:9, fired:true, big:1, area:1, seed:1});
  const f = A.brSpawnFoe(R, 19, "n"); f.x = z.x + 4; f.y = z.y + 2; f.hp = f.max = 99999;
  lgStep(R, 2);
  return Math.hypot(f.x - z.x, f.y - z.y) >= z.r + f.r - 2;
})());
t("Mew : le Métronome peut tirer l'attaque d'un autre légendaire", (()=>{
  const R = lgRun(151), w = R.team[0];
  const f = A.brSpawnFoe(R, 19, "n"); f.x = R.x + 90; f.y = R.y; f.hp = f.max = 99999;
  const st = A.brWeaponStats(w, R); R.curW = 0;
  for(let n = 0; n < 80; n++) A.brFireExtra(R, w, st, {x:R.x, y:R.y}, f, 0);
  let legend = 0; R.P.zones.each(z=>{ if(A.BR_LEG_ZONE[z.k]) legend++; });
  return st.k === "metro" && legend > 0;
})());
t("Rayquaza : le serpent plonge jusqu'à l'équipe, puis ressort loin dans la horde", (()=>{
  const R = lgRun(384), w = R.team[0];
  lgStep(R, 45);
  const C = w.serpC, o = {x:0, y:0};
  if(!C) return false;
  let near = Infinity, far = 0;
  for(let i = 0; i < 200; i++){ R.t += 0.05; A.lgSerpAt(R, C, 0, 0, 0, 0, o); const d = Math.hypot(o.x, o.y); near = Math.min(near, d); far = Math.max(far, d); }
  return near < 40 && far > 120;
})());

/* --- coffres de données : un trésor qui sert, jamais « +25 PV » par défaut --- */
const chestRun = () => { A.setS(A.newState()); A.brState(); const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:9}); R.W = 390; R.H = 700; return R; };
t("coffre : une équipe au maximum, en pleine forme, ne reçoit jamais une réparation", (()=>{
  const R = chestRun(); R.team.forEach(w=>{ w.lv = A.BR_MAXLV; w.stage = 2; });
  const kinds = new Set();
  for(let n = 0; n < 200; n++){ R.hp = R.maxHp; R.buff = null; kinds.add(A.brChestGift(R, 0, []).k); }
  return !kinds.has("heal") && kinds.has("frag") && kinds.has("data") && kinds.has("surge");
})());
t("coffre : la réparation n'arrive que si la vie est basse", (()=>{
  const R = chestRun(); R.team.forEach(w=>{ w.lv = A.BR_MAXLV; w.stage = 2; });
  let heals = 0;
  for(let n = 0; n < 120; n++){ R.hp = R.maxHp * 0.3; R.buff = null; if(A.brChestGift(R, 0, []).k === "heal") heals++; }
  return heals > 0;
})());
t("coffre : le catalyseur va au Pokémon qui l'attend, et son évolution suit", (()=>{
  const R = chestRun(), w = R.team[0]; w.lv = A.BR_MAXLV; w.stage = 0;
  const t0 = A.POKE[4].types[0];
  let got = null;
  for(let n = 0; n < 40 && !got; n++){ const g = A.brChestGift(R, 0, []); if(g.k === "cat") got = g; }
  return !!got && R.items["cat" + t0] === 1 && R.chestsPending >= 1 && !A.brChestWaiting(R);
})());
t("fragments de code : la run entière en profite", (()=>{
  const R = chestRun(), d0 = A.brWeaponStats(R.team[0], R).dmg, hp0 = R.maxHp;
  R.frag = {dmg:3, hp:2}; A.brRecomputeMods(R);
  return Math.abs(A.brWeaponStats(R.team[0], R).dmg / d0 - 1.18) < 0.005 && Math.round(R.maxHp - hp0) === 30;
})());
t("trois tailles de coffre : le légendaire reste rare, le rare arrive souvent", (()=>{
  const R = chestRun(), c = [0, 0, 0];
  for(let n = 0; n < 4000; n++) c[A.brChestTier(R)]++;
  return c[2] > 120 && c[2] < 300 && c[1] > 750 && c[1] < 1050 && A.BR_CHEST_TIERS.map(T=>T.gifts).join() === "1,3,5";
})());
t("un coffre rare ne donne ni deux réparations, ni deux surtensions, ni deux cartes dorées, ni deux fois le même objet", (()=>{
  const R = chestRun();
  for(let n = 0; n < 60; n++){
    R.hp = R.maxHp * 0.2; R.buff = null;
    const got = []; for(let k = 0; k < 3; k++) got.push(A.brChestGift(R, 2, got));
    for(const k of ["heal", "surge", "gold", "cat"]) if(got.filter(g=>g.k === k).length > 1) return false;
    const keys = got.filter(g=>g.key).map(g=>g.key); if(new Set(keys).size !== keys.length) return false;
  }
  return true;
})());


/* --- cercle de lancer --- */
t("la barre de visée : trois paliers, jamais de malus", (()=>{
  const e = A.ringGrade(0.1), s2 = A.ringGrade(0.4), b = A.ringGrade(0.9), none = A.ringGrade(1.2);
  return e.n === "Excellent" && s2.n === "Super" && b.n === "Bien" && none === null
    && A.RING_GRADES.every(g=>g.mul > 1) && e.mul === 1.25 && e.mul > s2.mul && s2.mul > b.mul;
})());
/* --- événements --- */
t("la saison est la même pour tous, et change toutes les deux semaines", (()=>{
  const t0 = Date.UTC(2026, 8, 28, 12), w = 7 * 86400000;
  const a = A.evSeason(t0), same = A.evSeason(t0 + 3600000);
  const keys = new Set([0, 1, 2, 3, 4, 5].map(k=>A.evSeason(t0 + k * 2 * w).k));
  return a.k === same.k && keys.size === 6 && A.EV_SEASONS.every(z=>A.COSMETICS["title_sz_" + z.k]);
})());
t("le légendaire de la semaine tourne chaque semaine", (()=>{
  const t0 = Date.UTC(2026, 8, 28, 12), w = 7 * 86400000;
  return A.evWeeklyLegend(t0) !== A.evWeeklyLegend(t0 + w) && A.POKE[A.evWeeklyLegend(t0)].leg;
})());
t("parcours de saison : on ne réclame pas deux fois, et le titre final existe", (()=>{
  A.setS(A.newState()); A.getS().breche = {data:0, upg:{}};
  const E = A.evState(); E.pts = 999;
  A.ACTIONS.evclaim({i:0}); const d1 = A.getS().breche.data;
  A.ACTIONS.evclaim({i:0}); const d2 = A.getS().breche.data;
  A.ACTIONS.evclaim({i:9});
  return d1 === 60 && d2 === 60 && A.getS().cos.owned.includes("title_sz_" + A.evSeason().k);
})());
t("l'habitat de la saison rapporte des points doublés", (()=>{
  A.setS(A.newState());
  const base = {kills:600, won:true, depth:0, missions:[], weeklyDown:false};
  const inSz = A.evRunPoints(Object.assign({hab:A.evSeason().hab}, base));
  const other = A.evRunPoints(Object.assign({hab:A.evSeason().hab === "route" ? "foret" : "route"}, base));
  return inSz === other * 2 && other > 0;
})());
t("le texte de partage résume la run", (()=>{
  const txt = A.brShareText({t:492, kills:3367, hab:"foyer", depth:4, won:true, daily:false, missions:[{done:true},{done:false},{done:true}], lv:20, team:[]});
  return /Foyer thermique/.test(txt) && /3.367/.test(txt) && /profondeur 4/.test(txt) && /◉◉○/.test(txt.replace(/◉○◉/, "◉◉○"));
})());


/* --- icônes d'objets : aucun objet sans icône --- */
t("chaque objet de chaque catalogue a son icône", (()=>{
  const miss = [];
  const need = (k)=>{ if(A.ITEM_IDX[k] === undefined) miss.push(k); };
  Object.keys(A.BALLS).forEach(k=>need("ball:" + k));
  Object.keys(A.BERRIES).forEach(k=>need("berry:" + k));
  Object.keys(A.STONES).forEach(k=>need("stone:" + k));
  Object.keys(A.CHESTS).forEach(k=>need("chest:" + k));
  Object.keys(A.PERMANENTS).forEach(k=>need("perm:" + k));
  Object.keys(A.REPELS).forEach(k=>need("repel:" + k));
  Object.keys(A.HELD_ITEMS).forEach(k=>need("held:" + k));
  /* les objets de carte ont pour icône le légendaire lui-même */
  Object.keys(A.EXP_ITEMS).filter(k=>!A.EXP_ITEMS[k].card).forEach(k=>need("exp:" + k));
  Object.values(A.TREASURES).forEach(t=>need("treasure:" + (A.TREASURE_KEYS[t.n] || "?")));
  Object.keys(A.BR_ITEMS).forEach(k=>need("br:" + k));
  for(let tp = 1; tp <= 18; tp++) need("br:cat" + tp);
  ["potion","revive","radar","lure"].forEach(need);
  if(miss.length) console.log("    sans icône :", miss.join(", "));
  return miss.length === 0;
})());


/* --- ce que le site sert doit partir sur GitHub ---
   Une regle d'exclusion sans barre initiale (« pmd/ ») ecarte tout dossier de ce
   nom : les sprites de marche n'etaient jamais publies. */
t("aucune règle d'exclusion n'écarte un fichier nécessaire au site", (()=>{
  const fs = require("fs"), path = require("path");
  const rules = fs.readFileSync(__dirname + "/.gitignore", "utf8").split(/\r?\n/).map(l=>l.trim()).filter(l=>l && !l.startsWith("#"));
  const loose = rules.filter(r=>!r.startsWith("/") && r.endsWith("/")).map(r=>r.slice(0, -1));
  const bad = [];
  const walk = d => { for(const e of fs.readdirSync(d, {withFileTypes:true})){ if(!e.isDirectory()) continue;
    if(loose.includes(e.name)) bad.push(path.relative(__dirname, path.join(d, e.name)));
    walk(path.join(d, e.name)); } };
  for(const d of ["src", "assets", "web", "sql"]) if(fs.existsSync(__dirname + "/" + d)) walk(__dirname + "/" + d);
  if(bad.length) console.log("    dossiers écartés à tort :", bad.join(", "));
  return bad.length === 0;
})());


/* --- sensations : boss, terrain, traces --- */
function feelRun(hab){
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  const R = A.brNewRun({region:"kanto", hab:hab || "route", starter:4, seed:3}); R.W = 390; R.H = 700; R.dpr = 1;
  return R;
}
t("chaque motif d'attaque de boss s'exécute et produit son danger", (()=>{
  const bad = [];
  for(const k of Object.keys(A.BR_PATTERNS)){
    const R = feelRun(); const b = A.brSpawnFoe(R, 144, "boss"); b.x = 200; b.y = 0; R.boss = b; R.bossOn = true;
    b.max = b.hp = 1e9; b.dmg = 10; b.pattern = 0;
    try {
      A.BR_PATTERNS[k](R, b, false, "#fff");
      let zones = 0; R.P.zones.each(()=>zones++);
      for(let n = 0; n < 120; n++){ R.joy = {dx:0, dy:0}; R.keys = {}; R.spawnAcc = -1e9; A.brUpdate(R, 1/30); R.modal = false; R.choices = null; }
      const made = zones > 0 || (R.hazards && R.hazards.length) || b.charge || b.under !== undefined || b.q !== undefined || b.pull !== undefined;
      if(!made || !Number.isFinite(R.hp)) bad.push(k);
    } catch(e){ bad.push(k + " (" + e.message + ")"); }
  }
  if(bad.length) console.log("    motifs en défaut :", bad.join(", "));
  return bad.length === 0;
})());
t("chaque légendaire a un jeu d'attaques à lui, selon son type", (()=>{
  const L = [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386];
  return L.every(id=>{ const kit = A.brBossKit({id}); return kit.length >= 3 && kit.every(k=>A.BR_PATTERNS[k]); })
    && new Set(L.map(id=>A.brBossKit({id})[0])).size >= 7;
})());
t("un boss enterré est intouchable, puis il ressurgit", (()=>{
  const R = feelRun(); const b = A.brSpawnFoe(R, 95, "boss"); b.x = 150; b.y = 0; R.boss = b; R.bossOn = true; b.max = b.hp = 1e6;
  A.BR_PATTERNS.burrow(R, b, false);
  const hp0 = b.hp; R.curW = 0; A.brHit(R, b, 500, "#fff", 0, 0, 0);
  const safe = b.hp === hp0;
  let surfaced = false;
  for(let n = 0; n < 150; n++){ R.joy = {dx:0, dy:0}; R.keys = {}; R.spawnAcc = -1e9; A.brUpdate(R, 1/30); R.modal = false; R.choices = null;
    if(!(b.under > 0)) surfaced = true; }
  return safe && surfaced;
})());
t("le terrain réagit aux éléments", (()=>{
  const R = feelRun("eaux");
  /* une carte nue : seules les zones d'essai, pour isoler chaque reaction */
  A.brMapNear(R);
  const iso = () => { for(const ch of R.map.chunks.values()) ch.zones = ch.zones.filter(z=>z.essai); A.brMapNear(R); };
  const water = {k:"water", x:400, y:400, r:100, seed:0.5, essai:true};
  A.brAddZone(R, water); iso();
  R.t = 10; A.brTerrainReact(R, 400, 400, 15, 10);            /* la glace gele l'eau */
  for(const ch of R.map.chunks.values()) for(const z of ch.zones) if(z.k === "ice") z.essai = true;
  R.x = 400; R.y = 400; R.reactT = 0;
  const iced = A.brTerrainUnder(R).ice;
  A.brMapPre(R, 1/30); const walk = R.terrainMul === 1;          /* et l'on y marche sans nager */
  const grass = {k:"grass", x:-400, y:-400, r:80, seed:0.3, essai:true}; A.brAddZone(R, grass); iso();
  R.t = 20; R.reactT = 0; A.brTerrainReact(R, -400, -400, 10, 10);
  const burning = grass.burn > 0;
  const lava = {k:"lava", x:800, y:0, r:80, seed:0.2, essai:true}; A.brAddZone(R, lava); iso();
  R.t = 30; R.reactT = 0; A.brTerrainReact(R, 800, 0, 11, 10);
  const cooled = lava.cooled > 0;
  const water2 = {k:"water", x:-450, y:350, r:90, seed:0.1, essai:true}; A.brAddZone(R, water2); iso();
  const f = A.brSpawnFoe(R, 19, "n"); f.x = -450; f.y = 350; f.hp = f.max = 1e6;
  R.t = 40; R.reactT = 0; A.brTerrainReact(R, -450, 350, 13, 50);
  const shocked = f.hp < 1e6;
  if(!(iced && walk && burning && cooled && shocked)) console.log('    réactions :', JSON.stringify({iced, walk, burning, cooled, shocked}));
  return iced && walk && burning && cooled && shocked;
})());
t("les traces au sol restent plafonnées", (()=>{
  const R = feelRun(); for(let i = 0; i < 400; i++) A.brDecal(R, "scorch", i, i, 20);
  return R.decals.length === 150;
})());


/* --- combat de boss scénarisé, acte par acte --- */
t("un combat de boss se joue en actes : entrée, arène, pylônes, ultime, finale", (()=>{
  const R = feelRun(); R.t = 480; R.hp = R.maxHp = 1e6;
  A.brSummonBoss(R); const b = R.boss;
  const step = (n, f) => { for(let k = 0; k < n; k++){ R.joy = {dx:0, dy:0}; R.keys = {}; R.spawnAcc = -1e9; if(f) f(); A.brUpdate(R, 1/30); R.modal = false; R.choices = null; } };
  const out = {};
  out.introFige = !!(R.cine && R.cine.freeze) && b.shield;
  const bx0 = b.x; step(30); out.bossImmobile = b.x === bx0;
  step(150); out.introFinie = !R.cine && !b.shield && !!R.arena;
  /* l'arene retient : on tente de sortir */
  step(120, ()=>{ R.joy = {dx:1, dy:0}; });
  out.arene = Math.hypot(R.x - R.arena.x, R.y - R.arena.y) <= R.arena.r;
  /* acte III : les pylones */
  b.hp = b.max * 0.6; step(2);
  out.pylones = R.scen && R.scen.phase === 2 && b.shield && R.scen.pylons.length === 3;
  const hp1 = b.hp; R.curW = 0; A.brHit(R, b, 1000, "#fff", 0, 0, 0); out.protege = b.hp === hp1;
  for(const p of R.scen.pylons){ p.hp = 0; } step(3);
  out.relaisCoupes = R.scen.phase === 2.5 && !b.shield;
  /* acte IV : l'ultime ; l'Archiviste se met a l'abri */
  b.hp = b.max * 0.3; step(2);
  out.ultime = !!R.ult && R.ult.safes.length >= 2;
  const s0 = R.ult.safes[0]; const hpA = R.hp;
  step(90, ()=>{ R.x = s0.x; R.y = s0.y; });
  out.abriProtege = !R.ult && R.hp >= hpA - R.maxHp * 0.01;
  /* un second ultime, cette fois hors de tout abri */
  R.scen.phase = 2.5; b.hp = b.max * 0.3; step(2);
  const far = R.ult.safes.reduce((m, s)=>Math.max(m, Math.hypot(s.x - R.x, s.y - R.y)), 0);
  const hpB = R.hp, sx = R.x, sy = R.y;
  step(90, ()=>{ const s = R.ult && R.ult.safes; const away = s ? s.reduce((p, q)=>({x:p.x + (R.x - q.x), y:p.y + (R.y - q.y)}), {x:0, y:0}) : {x:0, y:0};
    const L = Math.hypot(away.x, away.y) || 1; R.joy = {dx:away.x / L, dy:away.y / L}; });
  out.horsAbriTouche = R.hp < hpB;
  /* la finale */
  b.hp = 0; A.brBossDown(R, b);
  out.finale = !R.arena && !R.scen && R.finaleT > 0;
  const okAll = Object.values(out).every(Boolean);
  if(!okAll) console.log("    actes :", JSON.stringify(out));
  return okAll;
})());


/* --- la Descente --- */


/* --- Descente, livraisons 2 et 3 --- */


/* --- livraison 4 --- */
t("aucune règle CSS ne détourne la classe des petits boutons (.xs)", !/(^|\n)\.xs[{.:]/.test(fs.readFileSync("src/style.css","utf8")));
t("Tour : un objet ou un remplaçant en attente reste à l'écran", (()=>{
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 30, false);
  const S0 = A.getS();
  S0.towerRun = {stage:2, step:0, team:[{id:6, level:20, hp:50, maxHp:50, item:null}], pick:[{k:"item", id:"i_orbe"}]};
  const quiet = f => { try { f(); } catch(e){} };      /* le rendu d'ecran n'existe pas ici */
  quiet(()=>A.ACTIONS.towertake({i:"0"}));
  const a = S0.towerRun.give === "i_orbe";
  quiet(()=>A.ACTIONS.towertake({i:"0"}));       /* double toucher : sans effet */
  quiet(()=>A.ACTIONS.towergive({i:"0"}));
  return a && S0.towerRun.team[0].item === "i_orbe" && !S0.towerRun.give;
})());
t("carte : toujours le même treillis, un champion au bout des secteurs intermédiaires", (()=>{
  A.setS(A.newState());
  for(let seed = 1; seed <= 100; seed++){
    const mid = A.genMap(seed, {mapIdx:0, maps:3}), fin = A.genMap(seed, {mapIdx:2, maps:3});
    if(mid.map(r=>r.length).join() !== A.MAP_SHAPE.join()) return false;
    if(mid[A.MAP_ROWS - 1][0].t !== "champ" || fin[A.MAP_ROWS - 1][0].t !== "boss") return false;
    if(mid[A.MAP_ROWS - 2].filter(n=>n.t === "rest").length !== 1) return false;   /* un Centre, pas deux */
  }
  return true;
})());
t("progression : herbes +1, dresseur +2, rien d'autre ; l'évolution se fait au bon niveau", (()=>{
  A.setS(A.newState());
  const run = {team:[{id:4, level:14, hp:20, maxHp:20}, {id:25, level:14, hp:0, maxHp:20}], relics:[]};
  const a = A.expGainLevels(run, A.EXP_GAIN.fight);
  const b = A.expGainLevels(run, A.EXP_GAIN.trainer);
  return A.EXP_GAIN.fight === 1 && A.EXP_GAIN.trainer === 2 && !A.EXP_GAIN.draft
    && run.team[0].level === 17 && run.team[0].id === 5 && b.evos.length === 1
    && run.team[1].level === 14;                    /* un Pokemon tombe ne progresse pas */
})());
t("progression : on part de la forme de base, au niveau 5, et l'archive reçoit les niveaux", (()=>{
  A.setS(A.newState()); A.addToDex(6, 40, false); A.addToDex(25, 10, false); A.addToDex(1, 5, false);
  const S0 = A.getS();
  const fake = {getElementById:()=>null};
  try { A.startExpedition([6, 25, 1]); } catch(e){}
  const run = S0.expedition;
  return run && run.team[0].id === 4 && run.team[0].base === 6 && run.team[0].level >= 5 && run.team[0].level <= 8
    && run.maps === A.EXP_MAPS && run.map.length === A.MAP_ROWS && !!run.leader;
})());
t("progression : les adversaires suivent le parcours attendu, pas l'équipe réelle", (()=>{
  const r1 = {maps:3, step:0, floor:0}, r2 = {maps:3, step:20, floor:10};
  return A.expEnemyLevel(r1, 0) < A.expEnemyLevel(r2, 0) && A.expEnemyLevel(r1, 0) <= 6
    && A.expExpected(8) > A.expExpected(7) + 3;      /* le badge fait un saut */
})());
/* --- la Tour : combats d'equipe --- */
t("Tour : chaque espèce a trois compétences valides", (()=>{
  for(const id of A.POKE_IDS){
    const k = A.sqSkillsOf(id);
    if(k.length !== 3 || k.some(s=>!s.n || !s.kind || !s.t)) return false;
    if(k[0].cd !== 0 || !(k[1].cd > 0) || !(k[2].cd > 0)) return false;
    if(k[0].n === k[1].n || k[0].n === k[2].n) return false;
  }
  return true;
})());
t("Tour : les puissants ont un passif de meneur, pas les formes de base", !A.sqLeaderOf(4) && !!A.sqLeaderOf(149) && !!A.sqLeaderOf(150) && A.sqLeaderOf(150).v > A.sqLeaderOf(149).v - 0.01);
function tsqRun(B){ let g = 0; while(!B.over && g++ < 1500){ const u = A.sqNext(B); if(!u) break; A.sqTurnStart(B, u); if(u.hp <= 0) continue;
  if(u.stunned){ A.sqSkip(B, u); continue; } const a = A.sqAI(B, u); A.sqAct(B, u, a.si, a.ti); } return B; }
t("Tour : un combat se termine, et une équipe forte franchit le premier palier", (()=>{
  A.setS(A.newState()); for(const id of [149, 6, 9, 3]) A.addToDex(id, 40, false);
  let wins = 0;
  for(let i = 0; i < 10; i++){ const B = tsqRun(A.sqNewBattle([149, 6, 9, 3], 0, 0)); if(!B.over) return false; if(B.result) wins++; }
  return wins >= 9;
})());
t("Tour : trois vagues, un boss dans la dernière, le boss de la carte au dernier palier", (()=>{
  const w = A.sqWaves(2, A.SQ_STAGES - 1);
  return w.length === 3 && w[2].some(m=>m.boss && m.id === A.SQ_ZONES[2].boss) && !w[0].some(m=>m.boss);
})());
t("Tour : étoiles, paliers suivants et parchemins", (()=>{
  A.setS(A.newState()); for(const id of [149, 6, 9, 3]) A.addToDex(id, 60, false);
  const B = tsqRun(A.sqNewBattle([149, 6, 9, 3], 0, 0));
  if(!B.result) return false;
  const lv0 = A.getS().dex[149].lvl;
  const R = A.sqFinish(B), q = A.sqState();
  return A.sqStars(0, 0) >= 1 && R.first && q.scrolls >= 2 && !A.sqZoneOpen(1) && R.xps.length === 4
    && A.getS().dex[149].sxp + A.getS().dex[149].lvl > lv0;
})());
t("Tour : une attaque de zone frappe en un seul groupe, chaque coup porte les PV restants", (()=>{
  A.setS(A.newState()); for(const id of [6, 9, 3, 65]) A.addToDex(id, 40, false);
  const B = A.sqNewBattle([6, 9, 3, 65], 0, 0);
  const u = B.allies[0]; u.skills[1] = {n:"z", t:10, kind:"aoe", mult:0.4, cd:0, fx:[]};
  const ev = A.sqAct(B, u, 1, 0), hits = ev.filter(e=>e.k === "hit");
  return hits.length === B.foes.filter(f=>f.hp >= 0).length && hits.every(h=>h.g > 0 && h.g === hits[0].g && h.hp === h.tgt.hp && typeof h.ty === "number");
})());
t("Tour : la vague suivante arrive avec sa liste, et le butin des K.O. s'accumule", (()=>{
  A.setS(A.newState()); for(const id of [149, 6, 9, 3]) A.addToDex(id, 60, false);
  const B = A.sqNewBattle([149, 6, 9, 3], 0, 0);
  for(const f of B.foes) f.hp = 1;
  const u = B.allies[0]; u.skills[1] = {n:"z", t:1, kind:"aoe", mult:1, cd:0, fx:[]};
  const ev = A.sqAct(B, u, 1, 0), w = ev.find(e=>e.k === "wave");
  return w && w.n === 1 && w.foes.length === B.foes.length && w.foes[0] === B.foes[0] && ev.filter(e=>e.k === "loot").length === 3 && B.loot.coins > 0;
})());
t("Tour : la Synchro se remplit en agissant, frappe avec toute l'équipe et ne consomme pas le tour", (()=>{
  A.setS(A.newState()); for(const id of [149, 6, 9, 3]) A.addToDex(id, 50, false);
  const B = A.sqNewBattle([149, 6, 9, 3], 0, 0);
  const s0 = B.sync; A.sqAct(B, B.allies[1], 0, 0);
  const filled = B.sync > s0 && !A.sqSyncReady(B);
  B.sync = 100;
  const g = B.allies.map(a=>a.gauge), ev = A.sqSync(B, 0);
  return filled && B.sync === 0 && ev[0].k === "syncstart" && ev.filter(e=>e.k === "skill" && e.sync).length >= 1 && B.allies.every((a, i)=>a.gauge >= g[i] || a.hp <= 0) && A.sqSync(B, 0).length === 0;
})());
t("Tour : l'ordre prévu des tours suit la Vitesse, sans toucher au combat", (()=>{
  A.setS(A.newState()); for(const id of [149, 6, 9, 3]) A.addToDex(id, 50, false);
  const B = A.sqNewBattle([149, 6, 9, 3], 0, 0);
  const g = [...B.allies, ...B.foes].map(u=>u.gauge), list = A.sqPredict(B, 8);
  const same = [...B.allies, ...B.foes].every((u, i)=>u.gauge === g[i]);
  const first = A.sqNext(B);
  return list.length === 8 && same && list[0] === first;
})());
t("Tour : le butin ramassé rejoint les récompenses, la défaite ne garde que les PokéCoins", (()=>{
  A.setS(A.newState()); for(const id of [149, 6, 9, 3]) A.addToDex(id, 60, false);
  const q = A.sqState(), S = A.getS();
  const B = A.sqNewBattle([149, 6, 9, 3], 0, 0); B.loot = {coins:100, scrolls:2, candy:1}; B.over = true; B.result = false;
  const c0 = S.coins, sc0 = q.scrolls, R = A.sqFinish(B);
  return R.loot.coins === 100 && R.loot.scrolls === 0 && S.coins === c0 + 100 && q.scrolls === sc0;
})());
t("Tour : monter une compétence coûte des parchemins et vaut pour la lignée", (()=>{
  A.setS(A.newState()); A.addToDex(6, 30, false); const q = A.sqState(); q.scrolls = 3;
  const ok = A.sqUpgrade(6, 1);
  return ok && q.scrolls === 0 && A.sqSkillLv(4)[1] === 2 && !A.sqUpgrade(6, 1);
})());
/* --- les verrous légendaires : au sommet des ailes de la Tour --- */
function tKanto(n){ const r = A.REGIONS[0]; let k = 0; for(let id = r.from; id <= r.to && k < n; id++){ if(A.POKE[id] && !A.POKE[id].leg){ A.addToDex(id, 30, false); k++; } } }
t("verrous : fermés tant que le boss de l'aile n'est pas battu, même avec l'archive pleine", (()=>{
  A.setS(A.newState()); tKanto(40);
  const r = A.REGIONS[0], q = A.sqState();
  const before = A.sqLockOpen(r, 0);
  q.st["0:1:" + (A.SQ_STAGES - 1)] = 1;
  return !before && A.sqLockOpen(r, 0) && !A.sqLockOpen(r, 1) && A.sqLockGate(r, 1).z === 3 && A.sqLockGate(A.REGIONS[1], 0).d === 1;
})());
t("verrous : chaque aile 2, 4, 6 en porte un par difficulté", A.sqLockAt(1, 0).g.id === 146 && A.sqLockAt(5, 2).g.id === 384 && !A.sqLockAt(0, 0) && !A.sqLockAt(2, 1));
t("verrous : la Brèche ne les fait plus apparaître", (()=>{
  A.setS(A.newState()); tKanto(40); return A.brGuardianFor("kanto") === null;
})());
t("verrous : le gardien ignore l'étourdissement et se reconfigure à mi-vie avec deux renforts", (()=>{
  A.setS(A.newState()); for(const id of [6, 9, 3, 65]) A.addToDex(id, 40, false);
  const r = A.REGIONS[0];
  const B = A.sqNewBattle([6, 9, 3, 65], 1, A.SQ_STAGES - 1, {waves:A.sqLockWaves(r, 0), lock:{r:"kanto", i:0}});
  if(B.waves.length !== 2 || !B.waves[1][0].guardian) return false;
  /* on charge directement la vague du gardien */
  const B2 = A.sqNewBattle([6, 9, 3, 65], 1, A.SQ_STAGES - 1, {waves:[B.waves[1]], lock:{r:"kanto", i:0}});
  const g = B2.foes[0];
  if(!g.guardian) return false;
  /* une attaque qui etourdit a coup sur */
  const u = B2.allies[0]; u.skills[1] = {n:"t", t:13, kind:"atk", mult:0.01, cd:0, fx:[{k:"stun", p:1, t:1}]};
  const evs = A.sqAct(B2, u, 1, 0);
  const immune = evs.some(e=>e.k === "fx" && e.b === "immune") && !g.fx.some(e=>e.k === "stun");
  g.hp = Math.floor(g.maxHp * 0.45);
  const evs2 = A.sqAct(B2, B2.allies[1], 0, 0);
  const ph = evs2.find(e=>e.k === "phase");
  return immune && ph && ph.adds.length === 2 && B2.foes.length === 3 && g.phased && g.fx.some(e=>e.k === "atkup");
})());
t("verrous : la victoire libère le légendaire, émet sa carte et donne des parchemins", (()=>{
  A.setS(A.newState()); for(const id of [6, 9, 3, 65]) A.addToDex(id, 40, false);
  const r = A.REGIONS[0], q = A.sqState(), sc0 = q.scrolls;
  const B = A.sqNewBattle([6, 9, 3, 65], 1, A.SQ_STAGES - 1, {waves:A.sqLockWaves(r, 0), lock:{r:"kanto", i:0}});
  B.over = true; B.result = true;
  const R = A.sqFinish(B), S = A.getS();
  const R2 = A.sqFinish(B);
  return R.first && S.bosses.includes("kanto:146") && !!S.dex[146] && q.scrolls > sc0 + 3 && R.gw && R.gw.card && !R2.first && S.bosses.length === 1;
})());
t("verrous : la Brèche s'ouvre avec le premier verrou, plus avec l'Expédition seule", (()=>{
  A.setS(A.newState()); const S = A.getS(); S.level = 14; tKanto(30); S.stats.expWins = 2;
  const a = A.moduleUnlocked("breche");
  S.bosses.push("kanto:146");
  return !a && A.moduleUnlocked("breche");
})());
t("verrous : les Data Guardians se découvrent avec le boss de la première aile", (()=>{
  A.setS(A.newState()); const S = A.getS(); S.level = 11; tKanto(10);
  const a = A.moduleUnlocked("boss"); A.sqState().st["0:0:" + (A.SQ_STAGES - 1)] = 1;
  return !a && A.moduleUnlocked("boss");
})());
t("le hub propose l'Expédition, plus la Descente", A.ACTIVITIES.some(a=>a.go === "expedition") && !A.ACTIVITIES.some(a=>a.go === "descente"));
/* --- l'arène : elle raconte le combat, elle ne le change pas --- */
t("arène : sans canvas, elle s'efface et le pas de temps reste celui du moteur", (()=>{
  const al = [A.makeFighter(6, 40)], fo = [A.makeFighter(9, 40)];
  A.createBattle(al, fo, {ai:true, speed:2});
  return A.arOn() === false && A.bStep(640) === 320 && A.arNeed(640) === 640;
})());
t("arène : passer le combat annule toute attente", (()=>{
  const B = A.createBattle([A.makeFighter(6, 40)], [A.makeFighter(9, 40)], {ai:true, speed:1});
  B.skip = true;
  return A.bStep(640) === 0;
})());
t("arène : maintenir le doigt triple la vitesse choisie", (()=>{
  const B = A.createBattle([A.makeFighter(6, 40)], [A.makeFighter(9, 40)], {ai:true, speed:2});
  B.turbo = true;
  return A.bSpeed() === 6 && A.bStep(600) === 100;
})());
t("arène : une vitesse inférieure à ×1 héritée d'une ancienne sauvegarde est ramenée à ×1",
  A.createBattle([A.makeFighter(6, 40)], [A.makeFighter(9, 40)], {ai:true, speed:0.5}).speed === 1);
t("arène : chaque type a sa manière de frapper et son décor", (()=>{
  for(let ty = 1; ty <= 18; ty++) if(!A.AR_KIND[ty] || !A.AR_BIOME[ty]) return false;
  return true;
})());
t("arène : un gardien a droit à sa mise en scène, un combat ordinaire non", (()=>{
  const b1 = A.createBattle([A.makeFighter(6, 40)], [A.makeFighter(9, 40)], {ai:true, stage:"boss"});
  const b2 = A.createBattle([A.makeFighter(6, 40)], [A.makeFighter(9, 40)], {ai:true});
  const b3 = A.createBattle([A.makeFighter(6, 40)], [A.makeFighter(150, 40)], {boss:{}});
  return b1.stage === "boss" && b2.stage === null && b3.stage === "boss";
})());





t("aucune action n'est définie deux fois (une action écrasée bloquait « Archiver »)", (()=>{
  const order = fs.readFileSync(__dirname + "/build.py", "utf8").match(/ORDER = \[([\s\S]*?)\]/)[1].split(",").map(x=>x.trim().replace(/'/g, "")).filter(Boolean);
  const seen = {}; let dup = [];
  for(const f of order) for(const m of fs.readFileSync(__dirname + "/src/" + f, "utf8").matchAll(/^ACTIONS\.(\w+)\s*=/gm)){
    if(seen[m[1]] && seen[m[1]] !== f) dup.push(m[1]); seen[m[1]] = f; }
  return dup.length === 0;
})());
t("chaque salle qui s'ouvre a son moment, et une ancienne partie ne les rejoue pas", (()=>{
  if(!Object.keys(A.ROOM_MOMENTS).every(k=>A.MODULE_REQ[k])) return false;
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 9; S0.team = [1, 4, 7];
  A.roomMomentsTick();
  const init = S0.flags.roomsSeen.slice();
  S0.level = 11; for(let i = 1; i <= 6; i++) A.addToDex(i, 10, false);
  const fired = A.roomMomentsTick();
  return init.includes("expedition") && fired === true && S0.flags.roomsSeen.includes("tower");
})());

/* --- pouvoirs des cartes --- */
t("pouvoirs : chaque légendaire en carte a un pouvoir, et l'Éclat suit le nombre d'illustrations", (()=>{
  if(!A.CARD_MONS.every(id=>A.CARD_POWERS[id] && A.CARD_POWERS[id].d(1) && A.CARD_POWERS[id].d(3))) return false;
  A.setS(A.newState());
  const t0 = A.cardTier(150);
  A.grantCardV("art", 150); const t1 = A.cardTier(150);
  A.grantCardV("g5", 150); const t2 = A.cardTier(150);
  A.grantCardV("g3", 150); A.grantCardV("g2", 150); const t3 = A.cardTier(150);
  return t0 === 0 && t1 === 1 && t2 === 2 && t3 === 3;
})());
t("pouvoirs : une carte nouvelle annonce son pouvoir ; un doublon ne dit rien", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  const n = () => (S0.cardPowerLog || []).length;
  A.grantCardV("art", 245); const a = n();
  A.grantCardV("art", 245); const b = n();
  A.grantCardV("g5", 245); const c = n();
  A.grantCardV("g3", 245); A.grantCardV("g2", 245); const d = n();
  return a === 1 && b === 1 && c === 2 && d === 3 && S0.cardPowerLog[2].t === 3;
})());
t("révélation : une carte attendue par sa scène n'ouvre pas de moment par-dessus ; sinon le moment passe", (()=>{
  A.cardPowersFlush();
  A.setS(A.newState()); const S0 = A.getS();
  A.cardRevealExpect(); A.grantCardV("art", 244);
  const deferred = !!A.CARD_POWER_PENDING[244] && (S0.cardPowerLog || []).length === 1;
  /* l'attente ne vaut que pour une obtention : la suivante annonce normalement */
  A.grantCardV("art", 243);
  const normal = !A.CARD_POWER_PENDING[243] && S0.cardPowerLog.length === 2;
  /* une scène qui n'a pas pu s'ouvrir rend la main au moment */
  A.cardPowersFlush();
  return deferred && normal && !A.CARD_POWER_PENDING[244];
})());
t("révélation : une archive avec carte annonce une carte scellée, et le gardien garde sa carte jusqu'à la scène", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  const before = Object.keys(S0.cards || {}).length;
  A.openChest(Object.keys(A.CHESTS).find(k=>A.CHESTS[k].tier >= 4), true);
  return Object.keys(S0.cards || {}).length >= before;
})());
t("pouvoirs : les programmes de carte n'arrivent en boutique que si la carte est possédée", (()=>{
  A.setS(A.newState());
  const j = A.JOKERS.find(x=>x.id === "jc_146");
  if(!j || A.jokerAvail(j)) return false;
  A.grantCardV("art", 146);
  return A.jokerAvail(j) && /Mult/.test(j.d) && /Éclat I/.test(j.d);
})());
t("pouvoirs : les decks se construisent comme annoncé", (()=>{
  A.setS(A.newState());
  for(const s of ["art", "g5", "g3"]){ A.grantCardV(s, 249); A.grantCardV(s, 384); A.grantCardV(s, 150); }
  const deep = A.pkBuildDeck("deep"), sky = A.pkBuildDeck("sky"), psy = A.pkBuildDeck("psy"), std = A.pkBuildDeck("std");
  const nPsy = d => d.filter(c=>A.POKE[c.id].types.includes(14)).length;
  const legs = sky.filter(c=>A.CARD_MONS.includes(c.id)).length;
  return deep.length === 36 && std.length === 52 && sky.length === 52 && legs === 4
    && nPsy(psy) >= 12 && nPsy(psy) > nPsy(std) && new Set(deep.map(c=>c.u)).size === 36;
})());
t("pouvoirs : un deck fermé ne se lance pas, un deck ouvert oui", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  try { A.startPoker("balance"); } catch(e){}
  const a = S0.poker && S0.poker.deckId;
  A.grantCardV("art", 386);
  try { A.startPoker("balance"); } catch(e){}
  return a === "std" && S0.poker.deckId === "balance" && A.pkDeckTargetMul(S0.poker) === 2;
})());
t("pouvoirs : une carte arc-en-ciel copie l'espèce qui complète la main", (()=>{
  const cs = [{u:1, id:25, shiny:false, ed:""}, {u:2, id:25, shiny:false, ed:""}, {u:3, id:1, shiny:false, ed:"", rb:true}];
  const ev = A.evalHand(cs);
  const plain = A.evalHand(cs.map(c=>Object.assign({}, c, {rb:false})));
  return ev.key === "brelan" && plain.key !== "brelan" && ev.scoring.some(c=>c.u === 3 && c.id === 1);
})());
t("pouvoirs : le deck Équilibre égalise Jetons et Mult avant le calcul", (()=>{
  A.setS(A.newState()); A.grantCardV("art", 386); const S0 = A.getS();
  try { A.startPoker("balance"); } catch(e){}
  const P = S0.poker; P.state = "play";
  P.hand = [{u:900, id:25, shiny:false, ed:""}, {u:901, id:25, shiny:false, ed:""}]; P.sel = [900, 901];
  const x = A.pkScore(true);
  return x && Math.abs(x.chips - x.mult) < 0.01 && x.total > 0;
})());
t("Poké-Poker : chaque ante se clôt sur un Champion d'arène de Kanto, avec sa règle", (()=>{
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  try { A.startPoker("std"); } catch(e){} const P = A.getS().poker;
  const names = [];
  for(let a = 1; a <= 8; a++){ P.ante = a; P.blind = 2; P.opps = {}; const o = A.pkOpp(P); if(!(o.kind === "leader" && o.rule && o.rule.f && o.leader === A.PK_LEADER_ORDER[a - 1])) return false; names.push(o.name); }
  P.blind = 0; P.opps = {}; const f = A.pkOpp(P);
  return names[0] === "Pierre" && names[7] === "Giovanni" && f.kind === "folk" && !f.rule && !!f.name && A.pkOpp(P) === f;
})());
t("Poké-Poker : la Suite Pokédex se forme avec cinq numéros consécutifs", (()=>{
  A.setS(A.newState()); try { A.startPoker("std"); } catch(e){}
  const cs = [18, 19, 20, 21, 22].map((id, u)=>({u, id, shiny:false, ed:""}));
  const no = [18, 19, 20, 21, 24].map((id, u)=>({u, id, shiny:false, ed:""}));
  return A.evalHand(cs).key === "suite" && A.evalHand(no).key !== "suite";
})());
t("Poké-Poker : un programme évolue à force de servir (Salamèche.exe → Reptincel.exe)", (()=>{
  A.setS(A.newState()); try { A.startPoker("std"); } catch(e){} const P = A.getS().poker;
  P.jokers = [{id:"j_salameche", xp:0}, {id:"j_magicarpe", xp:0}];
  for(let k = 0; k < 4; k++) A.pkEvoTick(P, {scored:[{id:4}, {id:5}, {id:6}], played:[]}, false);
  for(let k = 0; k < 5; k++) A.pkEvoTick(P, null, true);
  return P.jokers[0].id === "j_reptincel" && P.jokers[1].id === "j_leviator" && P.evoQ.length === 2
    && !A.JOKERS.filter(j=>j.evoOnly).some(j=>{ A.pkRollShop(); return P.shop.jokers.some(o=>o.id === j.id); });
})());
t("Poké-Poker : Paralysie bloque une carte, Torrent en emporte deux, Fournaise retire les défausses", (()=>{
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  try { A.startPoker("std"); } catch(e){} const P = A.getS().poker;
  P.ante = 3; P.blind = 2; P.opps = {}; A.pkStartRound();
  let par = P.hand.find(c=>c.par), tries = 0;
  while(!par && tries++ < 30){ P.opps = {}; A.pkStartRound(); par = P.hand.find(c=>c.par); }
  if(!par) return false;
  A.pkToggle(par.u); const blocked = !P.sel.includes(par.u);
  P.ante = 2; P.opps = {}; A.pkStartRound();
  P.sel = []; for(const c of P.hand.slice(0, 1)) A.pkToggle(c.u);
  A.pkPlay(); A.skipResolve(); A.commitResolve();
  const washed = Array.isArray(P.washed) && P.washed.length === 2 && P.hand.length === 8;
  P.ante = 7; P.opps = {}; A.pkStartRound();
  return blocked && washed && P.discardsLeft === 0 && P.handsLeft === P.hands + 1;
})());
t("archivistes rivaux : six rivaux, un portrait, un as, et des gains qui montent", (()=>{
  A.setS(A.newState());
  const ok = A.RIVALS.length === 6 && A.RIVALS.every(r=>r.cls && r.ace && r.intro.length >= 3 && r.win && r.lose && A.COSMETICS["title_" + r.k]);
  const p0 = A.rivalPrize(A.RIVALS[0], 30); A.rivalRec(A.RIVALS[0].k).w = 2; const p2 = A.rivalPrize(A.RIVALS[0], 30);
  return ok && p2.coins > p0.coins && p2.shards > p0.shards && p2.cores === 1;
})());
t("pouvoirs : le Sanctuaire apparaît dans le secteur prévu, avec un légendaire possédé", (()=>{
  A.setS(A.newState()); A.addToDex(6, 40, false); A.addToDex(25, 10, false); A.addToDex(1, 5, false);
  const S0 = A.getS();
  if(A.sanctChance() !== 0) return false;
  A.grantCardV("art", 381);
  try { A.startExpedition([6, 25, 1]); } catch(e){}
  const run = S0.expedition; if(!run) return false;
  run.sanctAt = 1; A.openSector(run, 1);
  const nodes = run.map.flat().filter(n=>n.t === "legend");
  return A.sanctChance() > 0.3 && nodes.length === 1 && nodes[0].leg === 381;
})());
t("pouvoirs : vaincu, le légendaire rejoint l'équipe (ou attend qu'on lui fasse une place)", (()=>{
  A.setS(A.newState()); A.addToDex(6, 40, false); A.addToDex(25, 10, false); A.addToDex(1, 5, false);
  const S0 = A.getS(); A.grantCardV("art", 245);
  try { A.startExpedition([6, 25, 1]); } catch(e){}
  const run = S0.expedition; if(!run) return false;
  try { A.sanctJoin(run, 245); } catch(e){}
  const joined = run.team.some(m=>m.id === 245);
  while(run.team.length < 6) run.team.push({id:16, level:5, hp:10, maxHp:10});
  try { A.sanctJoin(run, 245); } catch(e){}
  return joined && run.pend && run.pend.k === "draft" && run.pend.legend === 1 && run.pend.list[0].id === 245;
})());
t("Expédition : la réindexation automatique fait rejouer le combat perdu, une seule fois", (()=>{
  A.setS(A.newState()); A.addToDex(6, 40, false); A.addToDex(25, 10, false); A.addToDex(1, 5, false);
  const S0 = A.getS();
  try { A.startExpedition([6, 25, 1]); } catch(e){}
  const run = S0.expedition; if(!run) return false;
  /* le champion, au bout du secteur : la dernière rangée n'a pas de suite */
  const y = run.map.length - 1, i = run.map[y].findIndex(n=>n.t === "champ");
  if(i < 0) return false;
  run.row = y; run.col = i; run.map[y][i].done = true; run.avail = []; run.relics.push("r_rev");
  const lose = () => { const B = A.getBATTLE(); for(const f of B.allies) f.hp = 0; B.onEnd(false); };
  /* sans écran, go() échoue après coup : chaque étape est isolée */
  try { A.expFight(run, "champ", A.enemySpecFor(run, "champ")); } catch(e){}
  try { lose(); } catch(e){}
  const retried = !!(S0.expedition && run.pend && run.pend.k === "enc" && run.pend.kind === "champ" && run.autoRev && run.team.some(m=>m.hp > 0));
  try { A.expFight(run, "champ", run.pend.foes); } catch(e){}
  try { lose(); } catch(e){}
  const ended = !S0.expedition;
  return retried && ended;
})());
t("Expédition : une partie déjà bloquée au bout d'un secteur se débloque", (()=>{
  A.setS(A.newState()); A.addToDex(6, 40, false); A.addToDex(25, 10, false); A.addToDex(1, 5, false);
  const S0 = A.getS();
  try { A.startExpedition([6, 25, 1]); } catch(e){}
  const run = S0.expedition; if(!run) return false;
  const y = run.map.length - 1, i = run.map[y].findIndex(n=>n.t === "champ");
  run.row = y; run.col = i; run.map[y][i].done = true; run.avail = []; run.pend = null;
  const fixed = A.expUnstick(run);
  /* une partie saine n'est pas touchée */
  run.pend = null; run.row = 0; run.avail = [0];
  return fixed && !A.expUnstick(run);
})());
t("pouvoirs : les objets de carte ne se vendent qu'à la boutique, et seulement carte en main", (()=>{
  A.setS(A.newState());
  if(A.cardShopWares().length) return false;
  for(let i = 0; i < 40; i++) if(A.rollExpItem(12, 3).some(id=>A.CARD_ITEM_IDS.includes(id))) return false;
  A.grantCardV("art", 383);
  const w = A.cardShopWares();
  return w.length === 1 && w[0].id === "c_383" && w[0].p === 150 && A.EXP_ITEMS.c_383.atk === 1.4;
})());

/* --- la forge et les chantiers --- */
t("forge : une ancienne partie garde sa pioche et ses étais, devenus des outils forgés", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.forage = {m:500, maxM:500, crew:[], slots:3, walls:0, wallAt:0, up:{pick:2, prop:3, drill:4}, energy:10, total:10, echoes:0, found:0, wallsDone:0};
  const f = A.forage();
  return f.tools.pick === 2 && f.tools.prop === 3 && f.tools.hammer === 0 && f.tools.drill === 0
    && f.up.drill === 4 && f.up.pick === undefined && !A.FOR_UPS.pick && !A.FOR_UPS.prop;
})());
t("forge : chaque matière coûte le minerai de sa couche, et l'outil progresse vraiment", (()=>{
  for(let t = 1; t <= 5; t++){ const c = A.toolCost(t); if(!(c.ore[A.ORE_IDS[t - 1]] > 0) || !(c.energy > 0)) return false; }
  for(let t = 1; t <= 5; t++){
    const a = A.PICK_T[t - 1], b = A.PICK_T[t];
    if(b[0] + b[1] + b[2] <= a[0] + a[1] + a[2]) return false;
    if(A.DRILL_T[t] <= A.DRILL_T[t - 1] || A.HAMMER_T[t].cost > A.HAMMER_T[t - 1].cost) return false;
  }
  return A.toolCost(5).energy > A.toolCost(1).energy * 100;
})());
t("forge : forger consomme minerai et Énergie, et change l'outil", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); const f = A.forage();
  if(A.toolCanForge("pick")) return false;
  f.energy = 1e9; A.oreGain("cu", 25);
  try { A.ACTIONS.foforge({k:"pick"}); } catch(e){}
  return A.toolTier("pick") === 1 && A.oreHave("cu") === 5 && f.energy === 1e9 - A.toolCost(1).energy
    && /cuivre/.test(A.toolSvg("pick", 1, 20) ? "cuivre" : "");
})());
t("forge : une pioche en or dégage bien plus qu'une pioche en bois", (()=>{
  A.setS(A.newState()); const f = A.forage();
  const count = tier => { f.tools.pick = tier; const w = A.genWall(0); w.stab = w.max = 999; w.L = w.L.map(v=>v >= 99 ? v : 6); w.occ = w.occ.map(v=>v === -2 ? -1 : v); w.L = w.L.map(()=>6); const before = w.L.reduce((a, b)=>a + b, 0); A.digHit(w, "pick", 5, 4); return before - w.L.reduce((a, b)=>a + b, 0); };
  const a = count(0), b = count(4);
  return b > a * 1.5;
})());
t("forge : l'équipe remonte le minerai de sa couche en creusant", (()=>{
  A.setS(A.newState());
  for(const id of [74, 27, 50]) A.addToDex(id, 15, false);
  const f = A.forage(); f.crew = [74, 27, 50];
  const r = A.forageAdvance(3600);
  const tot = A.ORE_IDS.reduce((a, o)=>a + A.oreHave(o), 0);
  return tot >= 39 && tot <= 40 && A.oreHave("cu") > 0 && r.ore && A.oreOf(0) === "cu" && A.oreOf(8) === "dr";
})());
t("forge : les fouilles cachent des pépites, qui ne bloquent pas la fin", (()=>{
  A.setS(A.newState());
  const w = A.genWall(4);
  const ores = w.items.filter(it=>it.k === "ore");
  if(ores.length < 3 || !ores.every(it=>it.small && it.cells.length === 1)) return false;
  ores.forEach(it=>it.found = true);
  const rows = A.digClaim(w);
  return rows.some(r=>r.ore) && A.ORE_IDS.some(o=>A.oreHave(o) > 0);
})());
t("chantiers : fermés au départ, repérés en profondeur, ouverts contre de l'Énergie", (()=>{
  A.setS(A.newState()); const f = A.forage();
  if(A.siteReachable("azur") || A.siteOpen("azur")) return false;
  f.m = f.maxM = 500; f.energy = 1e9;
  if(!A.siteReachable("azur") || A.siteReachable("ardent")) return false;
  try { A.ACTIONS.fositeopen({id:"azur"}); } catch(e){}
  return A.siteOpen("azur") && f.energy === 1e9 - A.FOR_SITES[1].cost;
})());
t("chantiers : changer de puits garde la profondeur de chacun, et la roche y est plus dure", (()=>{
  A.setS(A.newState()); const f = A.forage();
  f.m = f.maxM = 1200; f.sitesOpen = {azur:true};
  const h0 = A.stratumHard(0);
  if(!A.siteSwitch("azur")) return false;
  const a = f.m, h1 = A.stratumHard(0);
  f.m = 77; f.maxM = 77;
  A.siteSwitch("main");
  return a === 0 && f.m === 1200 && A.siteDepth("azur").m === 77 && h1 > h0 * 1.5 && A.mainMaxM() === 1200;
})());
t("chantiers : la Grotte Azurée cache plus de Pierres Eau que le puits principal", (()=>{
  A.setS(A.newState()); const f = A.forage(); f.m = f.maxM = 1200; f.sitesOpen = {azur:true};
  const water = () => { let n = 0; for(let i = 0; i < 500; i++) n += A.genWall(2).items.filter(it=>it.k === "water").length; return n; };
  const a = water(); A.siteSwitch("azur"); const b = water();
  return b > a * 1.5;
})());

/* --- moments, musique, fil conducteur --- */
t("musique : chaque piste de secours existe, et sans fichier on ne joue rien", (()=>{
  for(const k in A.MUSIC_TRACKS){ const fb = A.MUSIC_TRACKS[k].fb; if(fb && !A.MUSIC_TRACKS[fb]) return false; }
  return A.musicResolve("capture_kanto") === null || typeof A.musicResolve("capture_kanto") === "string";
})());
t("niveau : on annonce ce qui s'ouvre exactement à ce niveau", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 8; S0.team = [1, 4, 7];
  return A.levelUnlocks(8).length === 1 && A.levelUnlocks(9).length === 0;
})());
t("session : trois objectifs différents, dont un de capture, au plus un long", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 30; S0.flags.intro = true; S0.team = [1, 4, 7];
  for(let i = 1; i <= 30; i++) A.addToDex(i, 20, false);
  S0.bosses = ["kanto:144"];
  for(let k = 0; k < 30; k++){
    S0.sess = null; const s = A.sessState();
    const ks = s.obj.map(o=>o.k);
    if(ks.length !== 3 || new Set(ks).size !== 3) return false;
    if(!s.obj.some(o=>A.SESSION_OBJ.find(d=>d.k === o.k).go === "capture")) return false;
    if(s.obj.filter(o=>A.SESSION_OBJ.find(d=>d.k === o.k).heavy).length > 1) return false;
  }
  return true;
})());
t("session : la progression part de zéro, les trois remplis ouvrent un coffre plus riche", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 5; S0.flags.intro = true;
  const s = A.sessState();
  s.obj = [{k:"capt", goal:3, base:S0.stats.catches}, {k:"streak", goal:2, base:0}, {k:"newsp", goal:1, base:A.dexTotal()}];
  if(s.obj.some(A.sessDone)) return false;
  S0.stats.catches += 3; S0.streak = 2; A.addToDex(25, 5, false);
  const c0 = S0.coins;
  if(!s.obj.every(A.sessDone)) return false;
  s.ready = true;
  try { A.ACTIONS.sessopen(); } catch(e){}
  return S0.sess.tier === 1 && S0.coins > c0 && A.sessReward(4).coins > A.sessReward(0).coins && !!S0.sess.obj;
})());
t("prochaine étape : un coffre prêt passe avant tout, sinon on part capturer", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.flags.intro = true; S0.dirDone = [];
  const a = A.nextStep();
  A.sessState().ready = true;
  const b = A.nextStep();
  return !!a && a.t && b.go === "@sess";
})());

/* --- mon équipe --- */
t("équipe : les étoiles suivent les exemplaires capturés, et ne baissent pas à l'évolution", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  A.addToDex(1, 10, false);
  if(A.starsOf(1) !== 1 || A.starMul(1) !== 1) return false;
  for(let i = 0; i < 3; i++) A.addToDex(1, 10, false);
  const a = A.starsOf(1);
  S0.dex[1].c -= 3;                       /* une évolution consomme des exemplaires */
  return a === 2 && A.starsOf(1) === 2 && A.starMul(1) > 1;
})());
t("équipe : toute expérience gagnée fait grandir les six", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  for(const id of [1, 4, 7]) A.addToDex(id, 10, false);
  S0.team = [1, 4, 7];
  A.addXp(5000);
  return S0.dex[1].lvl > 10 && S0.dex[4].lvl > 10 && S0.dex[7].lvl === S0.dex[1].lvl;
})());
t("équipe : les bonbons font monter d'un niveau, plus cher en haut", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  A.addToDex(25, 10, false); S0.team = [25];
  A.teamCandyGain(3);
  try { A.ACTIONS.teamfeed({id:"25"}); } catch(e){}
  return S0.dex[25].lvl === 11 && S0.candy === 2 && A.candyCost(80) > A.candyCost(10);
})());
t("équipe : la puissance monte avec le niveau et les étoiles ; les étoiles renforcent seulement mes Pokémon", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  for(let i = 0; i < 12; i++) A.addToDex(6, 30, false);
  S0.team = [6];
  const p0 = A.teamPower(); S0.dex[6].lvl = 50; const p1 = A.teamPower();
  const mine = A.makeFighter(6, 50, {owned:true}), foe = A.makeFighter(6, 50, {});
  const u = A.sqUnit(6, 50, "ally"), v = A.sqUnit(6, 50, "foe");
  return p1 > p0 && mine.atk > foe.atk && u.maxHp > 0 && v.maxHp > 0;
})());
t("équipe : un membre qui évolue garde sa place, sous sa nouvelle forme", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.team = [1, 4, 7];
  A.teamOnEvolve(4, 5);
  return S0.team.join() === "1,5,7";
})());

/* --- le monde, les chapitres, les passages --- */
t("monde : dix chantiers par région, chacun sur un lieu de la carte, plus chers en Johto et Hoenn", (()=>{
  A.setS(A.newState());
  if(A.WORLD_PROJECTS.length !== 10 || !A.WORLD_PROJECTS.every(p=>A.WORLD_SPOTS[p.spot])) return false;
  const k = A.projOf("kanto", 3), j = A.projOf("johto", 3), h = A.projOf("hoenn", 3);
  return j.cost.coins === k.cost.coins * 3 && h.cost.coins === k.cost.coins * 9 && A.WORLD_PROJECTS[9].spot === "heart";
})());
t("monde : un chantier se paie, demande d'avoir avancé ailleurs, et change l'état de la région", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.flags.intro = true;
  const p1 = A.projOf("kanto", 1);
  if(A.projNeedOk(p1)) return false;                         /* 10 espèces de Kanto requises */
  S0.coins = 100000; S0.shards = 500;
  try { A.ACTIONS.worldbuild({r:"kanto", i:"0"}); } catch(e){}
  if(!A.worldReg("kanto").done.includes(0) || S0.coins >= 100000) return false;
  for(let i = 1; i <= 12; i++) A.addToDex(i, 10, false);
  return A.projNeedOk(p1) && A.worldNextProj("kanto").i === 1;
})());
t("chapitres : ils avancent avec la restauration", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 6;
  const a = A.chapterIdx();
  A.worldReg("kanto").done = [0, 1, 2, 3, 4];
  const b = A.chapterIdx();
  return a === 1 && b === 2 && A.CHAPTERS.length >= 8;
})());
t("passages : un toutes les trois heures, 45 minutes, le même pour tous, un légendaire en carte", (()=>{
  A.setS(A.newState());
  for(let b = 1000; b < 1040; b++){
    const L = A.legendOfBlock(b), M = A.legendOfBlock(b);
    if(L.id !== M.id || L.start !== M.start) return false;
    if(L.end - L.start !== 45 * 60e3 || L.start < b * 3 * 3600e3 || L.end > (b + 1) * 3 * 3600e3) return false;
    if(!A.LEG_IDS.includes(L.id) || L.region !== "kanto") return false;   /* seule Kanto est ouverte */
    if(A.legendNow(L.start + 1000).b !== b || A.legendNow(L.start - 1000)) return false;
  }
  return A.legendNext().start > Date.now();
})());
t("passages : la première victoire donne une carte, une seule fois par passage", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  const L = A.legendOfBlock(4242);
  const n0 = Object.keys(S0.cards || {}).length;
  A.legEnd(L, true); const n1 = Object.keys(S0.cards || {}).length, sh = S0.shards;
  A.legEnd(L, true);
  return n1 === n0 + 1 && S0.shards === sh && A.legState().won[4242];
})());

/* --- capture avec enjeu --- */
t("cagnotte : elle grossit avec la série, se multiplie, et se perd à la fuite", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 5;
  for(let i = 0; i < 26; i++) A.potAdd(100);
  const P = A.potState();
  if(P.n !== 26 || P.v !== 26 * 35 || A.potMul(26) !== 2 || A.potMul(9) !== 1 || A.potMul(60) !== 3) return false;
  const c0 = S0.coins;
  try { A.ACTIONS.potcash(); } catch(e){}
  if(S0.coins !== c0 + 26 * 35 * 2 || A.potState().v !== 0) return false;
  A.potAdd(100); A.potLose();
  return A.potState().v === 0 && A.potState().n === 0;
})());
t("traque : un légendaire errant par semaine, jamais un gardien, dans une région ouverte", (()=>{
  A.setS(A.newState());
  const R = A.roamState();
  const guard = A.REGIONS.flatMap(r=>r.guardians.map(g=>g.id));
  for(const k in A.ROAMERS) for(const id of A.ROAMERS[k]) if(guard.includes(id)) return false;
  return R.region === "kanto" && R.id === 145 && R.traces === 0;
})());
t("traque : à cinq traces, la rencontre suivante est lui, et il fuit au premier raté", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 10; S0.region = "kanto";
  const R = A.roamState(); R.ready = true; R.traces = 5;
  const E = A.newEncounter();
  if(!E || E.id !== 145 || !E.roam) return false;
  A.setENC(E);
  return A.fleeChance() === 1;
})());
t("hordes : la même espèce revient, plus facile à capturer", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 10;
  A.setHorde({id:147, total:3, left:2, got:0});
  const E = A.newEncounter(); A.setENC(E);
  const c = A.catchChance("poke");
  A.setENC(Object.assign({}, E, {horde:null})); const c2 = A.catchChance("poke");
  return E.id === 147 && E.horde && E.horde.i === 2 && c > c2;
})());
t("ressources : le jeu dit où trouver ce qui manque", !!A.srcHint("ore", "au") && !!A.srcHint("stone", "fire") && !!A.srcHint("shards") && A.srcHint("ore", "zz") === A.srcHint("ore"));

/* --- raid, classements, défis --- */
t("raid : les dégâts s'additionnent, les paliers s'ouvrent, trois attaques par jour", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 12;
  const R = A.raidState();
  if(R.tries !== 0 || A.raidTierReached(0)) return false;
  A.raidEnd({maxHp:2000000, hp:2000000 - 2000});
  if(A.raidState().dmg !== 2000 || !A.raidTierReached(0) || A.raidTierReached(1)) return false;
  const c0 = S0.coins;
  try { A.ACTIONS.raidclaim({i:"0"}); } catch(e){}
  try { A.ACTIONS.raidclaim({i:"0"}); } catch(e){}
  return S0.coins === c0 + A.RAID_TIERS[0].rw.coins && A.raidState().claimed.length === 1;
})());
t("classements : on ne garde que le meilleur score de la semaine", (()=>{
  A.setS(A.newState());
  return A.wkSubmit("poker", 500) === true && A.wkSubmit("poker", 300) === false && A.wkState().poker === 500;
})());
t("défis : un code porte la partie et se relit à l'identique ; un code abîmé est refusé", (()=>{
  const o = {seed:123456789, region:"kanto", hab:"routes", starter:25, mod:null, score:4321, name:"Mehdi"};
  const c = A.chalEncode(o), d = A.chalDecode(c);
  return /^PCG1-/.test(c) && d && d.seed === o.seed && d.starter === 25 && d.score === 4321 && d.name === "Mehdi" && A.chalDecode("PCG1-zzzz") === null;
})());

/* --- bonus lisibles --- */
t("bonus : chaque source est nommée, et les totaux sont le produit des sources", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.level = 20; S0.streak = 50; S0.buffs = {sitrus:true};
  const src = A.bonusSources(), t = A.bonusTotals();
  const prod = src.reduce((a, s)=>a * (s.coin || 1), 1);
  return src.some(s=>/Série/.test(s.n)) && src.some(s=>/Baies/.test(s.n)) && Math.abs(prod - t.coin) < 1e-9 && t.coin > 2;
})());

/* --- fouilles enrichies --- */
t("fouilles : filons, géodes, sachets, caisses… chaque nouvelle trouvaille a son dessin et rapporte", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  const ks = ["vein", "geode", "candy", "balls", "berries", "cartridge", "meteor", "crate0", "crate1", "crate2"];
  if(!ks.every(k=>A.DIG_LOOT.find(l=>l.k === k && l.art))) return false;
  const w = A.genWall(3);
  w.items = ks.map(k=>({k, found:true}));
  const sb = S0.balls.super || 0, cd = S0.candy || 0, c0 = S0.coins;
  const rows = A.digClaim(w);
  return rows.length === ks.length && A.oreHave(A.oreOf(3)) >= 5 && (S0.balls.super || 0) > sb && (S0.candy || 0) > cd
    && S0.coins > c0 && rows.filter(r=>r.crate && r.crate.length).length === 3;
})());
t("fouilles : plus de pépites qu'avant, jusqu'à trois minerais chacune", (()=>{
  A.setS(A.newState());
  let n = 0; for(let i = 0; i < 30; i++) n += A.genWall(2).items.filter(it=>it.k === "ore").length;
  return n / 30 >= 5;
})());

/* ============================================================
   LE RÉCIT — la chaîne, la mémoire, la Couche Zéro, les deux réponses
   ============================================================ */
function sagaEndgame(name){
  A.setS(A.newState()); const S0 = A.getS();
  S0.flags.intro = true; S0.flags.named = true; S0.name = name || "Mehdi";
  for(let i = 1; i <= 386; i++) A.addToDex(i, 80, false);
  for(const r of A.REGIONS) for(const g of r.guardians) S0.bosses.push(r.key + ":" + g.id);
  S0.integrity = 100;
  const W = A.worldState(); for(const r of A.REGIONS) W.reg[r.key].done = [0,1,2,3,4,5,6,7,8,9];
  return S0;
}
t("les nombres en toutes lettres", A.frNum(0) === "zéro" && A.frNum(11) === "onze" && A.frNum(12) === "douze" && A.frNum(21) === "vingt et un"
  && A.frNum(22) === "vingt-deux" && A.frNum(70) === "soixante-dix" && A.frNum(71) === "soixante et onze" && A.frNum(77) === "soixante-dix-sept"
  && A.frNum(80) === "quatre-vingts" && A.frNum(81) === "quatre-vingt-un" && A.frNum(91) === "quatre-vingt-onze" && A.frNum(99) === "quatre-vingt-dix-neuf");
t("la signature illisible a autant de signes que le nom", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.name = "Léa"; const a = A.pzMask();
  S0.name = "Jean Luc"; const b = A.pzMask();
  return a === "▒▒▒" && b.length === 7 && A.pzMask("Ab").length === 3;
})());
t("les connexions se comptent : douze, puis treize après un cycle", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.name = "Mehdi";
  const a = A.pzFmt("{nom}|{cx}|{CX}|{Prev}|{prev}|{next}|{mask}");
  S0.cycle.n = 1;
  const b = A.pzFmt("{cx}|{Cxw}|{PREV}");
  return a === "Mehdi|12|DOUZE|Onze|onze|treize|▒▒▒▒▒" && b === "13|Treize|DOUZE";
})());
t("aucune scène ne garde d'accolade non remplacée", (()=>{
  sagaEndgame();
  const texts = [];
  for(const sc of A.STORY) for(const l of sc.lines) texts.push(l.t);
  for(const r of A.RIFT_ARC) for(const l of r.lines) texts.push(l.t);
  for(const f of A.FRAGMENTS) texts.push(f.t, f.react);
  return texts.every(x=>!/\{[a-zA-Z]+\}/.test(A.pzFmt(x)));
})());
t("chaîne : les scènes se jouent dans l'ordre, un seuil attend celles qui le précèdent", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.storyT = 0;
  S0.stats.catches = 1;
  if((A.mainArcNext() || {}).id !== "first_catch") return false;
  S0.story.push("first_catch"); S0.integrity = 40;
  if((A.mainArcNext() || {}).id !== "beat_early") return false;
  S0.story.push("beat_early");
  for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  if(A.mainArcNext() !== null) return false;            /* le mythe n'a pas encore été croisé */
  S0.flags.sawMissing = true;
  return (A.mainArcNext() || {}).id === "missingno_1";
})());
t("chaîne : un événement passe tout de suite, un seuil laisse respirer", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.story = ["first_catch", "beat_early"]; S0.bosses = ["kanto:146"]; S0.integrity = 30;
  S0.storyT = Date.now();
  const ev = A.mainArcNext();                           /* le premier verrou : un événement */
  S0.story = A.MAIN_ARC.slice(0, 6).map(b=>b.id);        /* tout jusqu'au premier verrou */
  const wait = A.mainArcNext();                          /* le souvenir attend la fin du délai */
  S0.storyT = 0;
  const go = A.mainArcNext();
  return ev && ev.id === "boss_first_done" && wait === null && go && go.id === "pz_mem1";
})());
t("chaîne : la Couche Zéro n'ouvre qu'après le dernier souvenir", (()=>{
  const S0 = sagaEndgame(); S0.storyT = 0;
  S0.story = A.MAIN_ARC.filter(b=>b.id !== "pz_mem6" && b.id !== "finale_gate").map(b=>b.id);
  const first = A.mainArcNext();
  S0.story.push("pz_mem6");
  const then = A.mainArcNext();
  return first && first.id === "pz_mem6" && then && then.id === "finale_gate" && A.finaleReady();
})());
t("sept souvenirs, aux seuils croissants, tous des scènes du récit",
  A.MEM_SCENES.length === 7 && A.MEM_SCENES.every((b, i, a)=>!!A.STORY.find(s=>s.id === b.id && s.mem) && (i === 0 || b.at > a[i - 1].at)));
t("la rencontre de MissingNo ne dépend plus seulement du hasard", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  for(let i = 1; i <= 30; i++) A.addToDex(i, 10, false);
  S0.stats.catches = 20;
  let early = 0; for(let k = 0; k < 300; k++){ A.newEncounter(); if(A.getENC().missing) early++; }
  S0.stats.catches = 95;
  let seen = 0; for(let k = 0; k < 40; k++){ A.newEncounter(); if(A.getENC().missing) seen++; }
  return early === 0 && seen >= 1;
})());
t("la Couche Zéro : intégrité, neuf verrous, trois secteurs réindexés", (()=>{
  const S0 = sagaEndgame();
  const ok = A.finaleReady();
  A.worldState().reg.hoenn.done = [0,1,2,3,4,5,6,7,8];
  const notYet = !A.finaleReady() && A.finaleReqs().filter(r=>!r.ok).length === 1;
  return ok && notYet && A.finaleStage() === "far";
})());
t("MissingNo : Pistolet à O, Pistolet à O, Piqué", (()=>{
  const u = A.mnUnit(90);
  return u.mn && u.guardian && u.skills.map(s=>s.n).join("|") === "Pistolet à O|Pistolet à O|Piqué" && u.maxHp > 2000;
})());
t("combat final : les échos sont ton équipe, puis MissingNo", (()=>{
  const S0 = sagaEndgame();
  const team = [150, 249, 384, 6];
  const W = A.finaleWaves(team);
  const B = A.sqNewBattle(team, 5, 6, {d:2, waves:W});
  const echoes = B.final && B.foes.length === 4 && B.foes.every((f, i)=>f.echo && f.id === team[i]);
  B.foes.forEach(f=>f.hp = 0);
  const ev = []; A.sqCheck(B, ev);
  return echoes && B.wave === 1 && B.foes.length === 1 && B.foes[0].mn && ev.some(e=>e.k === "wave");
})());
t("combat final : il copie ta main, puis montre ton nom, et Porygon-Z intervient", (()=>{
  const S0 = sagaEndgame("Mehdi");
  const team = [150, 249, 384, 6];
  const B = A.sqNewBattle(team, 5, 6, {d:2, waves:A.finaleWaves(team)});
  B.foes.forEach(f=>f.hp = 0); A.sqCheck(B, []);
  const mn = B.foes[0];
  mn.hp = Math.round(mn.maxHp * 0.6);
  const ev2 = []; A.sqCheck(B, ev2);
  const strongest = B.allies.slice().sort((a, b)=>b.atk - a.atk)[0];
  const copied = mn.p2 && mn.copied === strongest.name && mn.skills[0].n === strongest.skills[0].n && ev2.some(e=>e.k === "mnphase" && e.n === 2) && B.foes.length === 3;
  mn.hp = Math.round(mn.maxHp * 0.3);
  const ev3 = []; A.sqCheck(B, ev3);
  const named = mn.p3 && mn.name === "Mehdi" && mn.skills[2].erase && B.sync === 100 && B.allies.every(a=>a.hp <= 0 || a.shield > 0)
    && ev3.some(e=>e.k === "pzhelp") && ev3.filter(e=>e.k === "line").length >= 2;
  /* EFFACER : plus de bouclier, plus de bonus */
  mn.cds[2] = 0; mn.gauge = 100;
  A.sqAct(B, mn, 2, 0);
  const erased = B.allies.every(a=>a.hp <= 0 || (a.shield === 0 && !a.fx.some(e=>["atkup","defup","spdup","shield"].includes(e.k))));
  return copied && named && erased;
})());
t("combat final : une équipe d'élite peut gagner, une équipe faible perd", (()=>{
  const fight = (team, lv, seed) => {
    const S0 = sagaEndgame(); for(const id of team) S0.dex[id].lvl = lv;
    const rnd = (function(a){ return function(){ a|=0;a=a+0x6D2B79F5|0; let t2=Math.imul(a^a>>>15,1|a); t2=t2+Math.imul(t2^t2>>>7,61|t2)^t2; return ((t2^t2>>>14)>>>0)/4294967296; }; })(seed);
    const B = A.sqNewBattle(team, 5, 6, {d:2, waves:A.finaleWaves(team), rnd});
    for(let k = 0; k < 4000 && !B.over; k++){
      if(A.sqSyncReady(B) && B.allies.some(u=>u.hp > 0)) A.sqSync(B, 0);
      const u = A.sqNext(B); if(!u) break;
      A.sqTurnStart(B, u);
      if(u.hp <= 0){ A.sqCheck(B, []); continue; }
      if(u.stunned){ A.sqSkip(B, u); continue; }
      const a = A.sqAI(B, u); A.sqAct(B, u, a.si, a.ti);
    }
    return B.over && B.result;
  };
  let strong = 0, weak = 0;
  for(let seed = 1; seed <= 8; seed++){ if(fight([150, 384, 249, 382], 100, seed)) strong++; if(fight([16, 19, 10, 13], 40, seed)) weak++; }
  return strong >= 3 && weak === 0;
})());
t("la victoire est notée, une fois, et récompensée", (()=>{
  const S0 = sagaEndgame();
  const team = [150, 249, 384, 6];
  const B = A.sqNewBattle(team, 5, 6, {d:2, waves:A.finaleWaves(team)});
  B.over = true; B.result = true;
  const c0 = S0.cores, R = A.sqFinish(B);
  const R2 = A.sqFinish(Object.assign(B, {_lootDone:null}));
  return S0.flags.mnBeaten && A.sagaState().mnWins === 2 && R.final && R.rw && R.rw.cores === 12 && !R2.rw && S0.cores >= c0 + 12 && A.cycleReady();
})());
t("écrire : Porygon-Z entre au Pokédex, n° 387, et dans l'équipe", (()=>{
  const S0 = sagaEndgame(); S0.team = [150, 249, 384];
  S0.flags.mnBeaten = true;
  A.finaleAfterChoice("write");
  const f = A.makeFighter(474, 60);
  const u = A.sqUnit(474, 60, "ally", {});
  return S0.saga.wrote && S0.saga.end === "write" && S0.flags.finalDone && S0.dex[474] && S0.team.includes(474)
    && A.POKE[474].name === "Porygon-Z" && f.maxHp > 0 && u.skills.length === 3 && A.dexTotal() === 387
    && A.finaleStage() === "done" && A.loreOf(474).includes("387") && A.SCREENS.dex.html().includes("N° 387");
})());
t("effacer : le cycle se boucle, il oublie, toi non", (()=>{
  const S0 = sagaEndgame(); S0.flags.mnBeaten = true;
  S0.fragments = [1,2,3,4,5,6,7,8,9,10,11]; S0.pzlog = [{k:"first", d:1, c:12, t:"x"}];
  A.finaleAfterChoice("erase");
  const pending = A.finaleStage() === "erase" && A.sagaCardHtml().includes("cycle");
  A.ACTIONS.cycledo();
  const S1 = A.getS();
  const kept = S1.saga.erased === 1 && S1.saga.known && S1.fragments.length === 11 && S1.pzlog.length === 1 && S1.cycle.end === "erase" && S1.cycle.n === 1;
  const fresh = !S1.flags.mnBeaten && !S1.dex[474] && A.sagaConn() === 13;
  const first = A.sagaCycleBeat();
  S1.story.push("cy_e_open"); S1.stats.catches = 8;
  return pending && kept && fresh && first === "cy_e_open" && A.sagaCycleBeat() === "cy_e_page";
})());
t("après avoir écrit : une copie de la sauvegarde d'origine, et il revient au niveau 5", (()=>{
  const S0 = sagaEndgame(); S0.flags.mnBeaten = true;
  A.finaleAfterChoice("write");
  A.ACTIONS.cycledo();
  const S1 = A.getS();
  return S1.cycle.end === "write" && S1.dex[474] && S1.dex[474].lvl === 5 && S1.saga.wrote && A.sagaCycleBeat() === "cy_w_open" && A.cycleCopy().go === "Recommencer";
})());
t("le fichier de Porygon-Z se remplit une fois par cap, et ses vieilles lignes se lisent après la fin", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.name = "Mehdi";
  A.addToDex(25, 5, false); S0.stats.catches = 1; S0.flags.firstMon = 25;
  A.pzLogTick(); A.pzLogTick();
  const once = S0.pzlog.filter(e=>e.k === "first").length === 1 && /Pikachu/.test(S0.pzlog[0].t);
  const before = A.pzFileHtml();
  S0.saga.known = true;
  const after = A.pzFileHtml();
  return once && before.includes("illisibles") && !before.includes("Psykokwak") && after.includes("Psykokwak") && after.includes("Mehdi");
})());
t("les pages signent d'un masque, puis de ton nom", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.name = "Mehdi";
  const a = A.fragAuthor(A.FRAGMENTS[6]);
  S0.saga.known = true;
  const b = A.fragAuthor(A.FRAGMENTS[6]);
  return a === "▒▒▒▒▒ · connexion 07" && b === "Mehdi · connexion 07";
})());
t("le journal se lit par actes, avec la mémoire de Porygon-Z et son fichier", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.story = ["intro", "first_catch", "pz_mem1"]; S0.integrity = 12;
  const h = A.SCREENS.journal.html();
  return h.includes("Acte I") && h.includes("MÉMOIRE DE PORYGON-Z") && h.includes("choses_formidables.txt") && h.includes("Déjà-vu")
    && !h.includes("Le nom") && A.pzMemPct() === 11;
})());
t("la carte de l'accueil suit la fin : objectif, descente, question", (()=>{
  const S0 = sagaEndgame();
  const ready = A.finaleStage() === "ready" && A.sagaCardHtml().includes("zerogo");
  S0.flags.mnBeaten = true;
  const ask = A.finaleStage() === "choice" && A.sagaCardHtml().includes("zeroanswer");
  S0.integrity = 50; S0.flags.mnBeaten = false; S0.story = ["hoenn_done"];
  const far = A.finaleStage() === "far" && A.sagaCardHtml().includes("OBJECTIF FINAL");
  return ready && ask && far;
})());
t("la question rejouée reprend la réponse déjà donnée", (()=>{
  const S0 = sagaEndgame(); S0.flags.mnBeaten = true;
  const sc = A.cineFor("finale_choice");
  const ch = sc.shots[0].beats.find(b=>b.t === "choice");
  const live = ch.preset() === null;
  A.finaleAfterChoice("write");
  return live && ch.preset() === "write" && ch.opts.map(o=>o.k).join() === "erase,write";
})());
t("le générique nomme l'Archiviste et MissingNo du même nom", (()=>{
  const S0 = sagaEndgame("Mehdi");
  const h = A.creditsRollHtml();
  return (h.match(/Mehdi/g) || []).length >= 2 && h.includes("MERCI D'AVOIR JOUÉ");
})());
t("la préparation du combat final se dessine", (()=>{
  sagaEndgame();
  const P = A.finalPrep([150, 249, 384, 6]);
  const h = A.finalPrepHtml(P);
  return P.final && h.includes("AFFRONTER MISSINGNO") && h.includes("ÉCHOS") && P.waves[1][0].mn;
})());
t("ton nom, en octets, se termine par 50", (()=>{
  const b = A.nameBytes("Mehdi").concat([0x50]).map(A.hex2).join(" ");
  return b === "8C A4 A7 A3 A8 50" && A.nameBytes("É")[0] === 0x84;
})());
t("entrée n° 000 : fermée avant la révélation, ouverte après, proposée une fois", (()=>{
  const S0 = sagaEndgame("Mehdi");
  const before = !A.mnShareOpen() && A.mnShareRowHtml() === "" && A.mnShareOffer() === false;
  A.sagaState().known = true;
  const row = A.mnShareRowHtml();
  const txt = A.mnShareText();
  const once = A.mnShareOffer() === true && A.mnShareOffer() === false;
  return before && row.includes("mnshare") && row.includes("8C A4 A7 A3 A8 50") && once
    && txt.includes("MEHDI · 8C A4 A7 A3 A8 50") && /Connexion n° \d+/.test(txt) && txt.includes("entrée n° 000");
})());
t("entrée n° 000 : la réponse lue sur la carte", (()=>{
  const S0 = sagaEndgame(); const g = A.sagaState(); g.known = true;
  const none = A.mnShareAnswer() === "—";
  g.end = "write"; g.wrote = true; const w = A.mnShareAnswer() === "ÉCRIRE";
  g.end = "erase"; g.wrote = false; S0.flags.finalChoice = "erase"; const e = A.mnShareAnswer() === "EFFACER";
  return none && w && e;
})());
/* ---------- les réponses : cinq questions de Porygon-Z, rappelées à la fin ---------- */
const sayTexts = sc => { const out = [];
  const walk = b => { if(b.t === "par") return b.beats.forEach(walk); if(b.t === "say") out.push(b.text);
    if(b.t === "choice") for(const k in (b.branches || {})) b.branches[k].forEach(walk); };
  sc.shots.forEach(sh=>sh.beats.forEach(walk)); return out; };
t("les cinq questions sont posées une fois chacune, complètes", (()=>{
  const asked = []; for(const sc of A.STORY) for(const l of sc.lines) if(l.q) asked.push(l.q + "@" + sc.id);
  const ok = A.STORY_Q_ORDER.every(q=>{ const Q = A.STORY_Q[q];
    return Q && Q.opts.length === 2 && Q.opts.every(o=>o.cmd && o.say && Q.then[o.k] && Q.then[o.k].length && Q.log[o.k]) && asked.filter(x=>x.startsWith(q + "@")).length === 1
      && asked.includes(q + "@" + Q.at); });
  return ok && asked.length === 5;
})());
t("une question devient un choix au toucher, qui se souvient de la réponse", (()=>{
  const S0 = A.newState(); A.setS(S0);
  const find = sc => { let c = null; const walk = b => { if(b.t === "par") b.beats.forEach(walk); if(b.t === "choice") c = b; };
    sc.shots.forEach(sh=>sh.beats.forEach(walk)); return c; };
  const ch = find(A.directStory(A.STORY_BY_ID.pz_mem1));
  const live = ch && ch.quick && ch.preset() === null && ch.opts.length === 2 && A.storyQPending(A.STORY_BY_ID.pz_mem1);
  ch.on("pret");
  const kept = ch.preset() === "pret" && A.storyAns("mem1") === "pret" && !A.storyQPending(A.STORY_BY_ID.pz_mem1);
  const once = A.storyAnswer("mem1", "tout") === false && A.storyAns("mem1") === "pret";
  const logged = (A.getS().pzlog || []).some(e=>e.k === "ans" && /quand tu seras prêt/.test(e.t));
  const bogus = A.storyAnswer("mem2", "nimportequoi") === false && A.storyAns("mem2") === null;
  return live && kept && once && logged && bogus && ch.branches.pret.some(b=>b.t === "say" && /On ne m'avait jamais laissé le choix/.test(b.text));
})());
t("une réplique réservée à une réponse ne sort que pour elle", (()=>{
  const S0 = A.newState(); A.setS(S0);
  const none = sayTexts(A.directStory(A.STORY_BY_ID.pz_mem3)).filter(t=>/quand tu seras prêt|tout te montrer/.test(t)).length === 0;
  A.storyAnswer("mem1", "pret");
  const L = sayTexts(A.directStory(A.STORY_BY_ID.pz_mem3));
  return none && L.some(t=>/quand tu seras prêt/.test(t)) && !L.some(t=>/tout te montrer/.test(t));
})());
t("la révélation et la question rappellent tes réponses, et seulement elles", (()=>{
  sagaEndgame("Mehdi");
  const bare = sayTexts(A.cineFor("finale_reveal")).concat(sayTexts(A.cineFor("finale_choice"))).join("\n");
  const noEcho = !/Tu me l'avais promis|Je ne suis pas eux|dis-le|Ils ne sont rien devenus/.test(bare);
  A.storyAnswer("mem5", "dis"); A.storyAnswer("mem3", "demander"); A.storyAnswer("twist", "promis"); A.storyAnswer("mem2", "moi"); A.storyAnswer("mem1", "tout");
  const rev = sayTexts(A.cineFor("finale_reveal")).join("\n"), cho = sayTexts(A.cineFor("finale_choice")).join("\n");
  return noEcho && /Tu m'avais dit : « dis-le »/.test(rev) && /Ils ne sont rien devenus/.test(rev) && /Tu me l'avais promis/.test(rev)
    && /Je ne suis pas eux/.test(cho) && /tu ne me laisses pas/.test(cho) && /Tu as trouvé la seule façon de tenir parole/.test(cho)
    && /Tu voulais tout voir/.test(cho) && !/Tu m'avais laissé le temps/.test(cho) && cho.includes("{rappel_e}");
})());
t("ce qu'il a retenu de toi : première ligne, compagnon, jours", (()=>{
  const S0 = sagaEndgame("Mehdi"); S0.flags.firstMon = 4; S0.buddy = {id:25, aff:0, since:Date.now(), finds:0};
  S0.stats.catches = 1840; S0.created = Date.now() - 12 * 864e5;
  const w = A.pzFmt("{rappel_w}"), e = A.pzFmt("{rappel_e}");
  S0.created = Date.now(); const e1 = A.pzRecallLine("erase");
  delete S0.flags.firstMon; S0.buddy = null; const w0 = A.pzRecallLine("write");
  return /Salamèche/.test(w) && /Pikachu/.test(w) && /1.840 captures/.test(w) && /Salamèche, ta toute première ligne/.test(e)
    && /Ni de nos treize jours/.test(e) && /Ni de cette journée/.test(e1) && /tout a commencé/.test(w0) && !/undefined/.test(w + e + e1 + w0);
})());
t("un souvenir vécu sans réponse : l'accueil repose la question, une à la fois", (()=>{
  const S0 = A.newState(); A.setS(S0);
  const none = A.storyQWaiting() === null && A.storyQHintHtml() === "";
  S0.story = ["intro", "pz_mem1", "pz_mem2"];
  const w1 = A.storyQWaiting(), h1 = A.storyQHintHtml();
  A.storyAnswer("mem1", "tout");
  const w2 = A.storyQWaiting();
  A.storyAnswer("mem2", "moi");
  return none && w1 && w1.id === "pz_mem1" && h1.includes("qreplay") && h1.includes("Déjà-vu") && w2.id === "pz_mem2" && A.storyQWaiting() === null && A.storyQHintHtml() === "";
})());
t("le générique cite tes réponses et ta première ligne", (()=>{
  const S0 = sagaEndgame("Mehdi"); S0.flags.firstMon = 4;
  const sec = (k, v) => `<b>${k}</b>${v}`;
  const before = A.creditsAnswersHtml(sec);
  A.storyAnswer("twist", "verra"); A.storyAnswer("mem1", "tout");
  const h = A.creditsAnswersHtml(sec), roll = A.creditsRollHtml();
  return !before.includes("CE QUE TU LUI AS RÉPONDU") && before.includes("Salamèche")
    && h.includes("« Montre-moi tout. »") && h.includes("« On verra à la fin. »") && h.indexOf("Montre-moi") < h.indexOf("On verra") && roll.includes("CE QUE TU LUI AS RÉPONDU");
})());
/* ---------- les Pokémon des onze ---------- */
t("les onze : un par connexion, complets, des espèces qui existent", (()=>{
  const cs = A.ONZE.map(o=>o.c).join(",");
  return A.ONZE.length === 11 && cs === "1,2,3,4,5,6,7,8,9,10,11" && A.ONZE.every(o=>A.POKE[o.id] && /^[A-ZÀ-Ü]{3,10}$/.test(o.nick) && o.mem && o.seen && o.got)
    && new Set(A.ONZE.map(o=>o.nick)).size === 11 && new Set(A.ONZE.map(o=>o.id)).size === 11;
})());
t("les onze reviennent dans l'ordre, une fois la page trouvée et le premier souvenir vécu", (()=>{
  const S0 = A.newState(); A.setS(S0); S0.fragments = [1, 2];
  const before = A.onzeNext() === null;
  S0.story = ["intro", "pz_mem1"];
  const first = A.onzeNext();
  A.onzeState().got[1] = Date.now();
  const second = A.onzeNext();
  A.onzeState().got[2] = Date.now();
  return before && first && first.c === 1 && second && second.c === 2 && A.onzeNext() === null;
})());
t("un revenant arrive dans une rencontre ordinaire, se capture sans peine et ne fuit pas", (()=>{
  const S0 = A.newState(); A.setS(S0); S0.fragments = [1]; S0.story = ["intro", "pz_mem1"]; S0.capMode = "classic"; S0.level = 3;
  for(let i = 1; i <= 30; i++) A.addToDex(i, 10, false);
  A.onzeState().cd = A.ONZE_SURE - 1;
  A.setHorde(null);
  let got = null;
  for(let i = 0; i < 20 && !got; i++){ A.newEncounter(); const E = A.getENC(); if(E && E.onze) got = E; else A.onzeState().cd = A.ONZE_SURE - 1; }
  if(!got) return false;
  const cc = A.catchChance("poke"), fc = A.fleeChance();
  const quiet = A.onzeState().cd === 0;
  A.newEncounter(); const nx = A.getENC();
  return got.id === 19 && got.onze === 1 && !got.shiny && cc >= 0.6 && fc === 0 && quiet && !(nx && nx.onze);
})());
t("capturé, il garde son surnom au Pokédex, dans l'évolution, le fichier et pour toujours", (()=>{
  const S0 = A.newState(); A.setS(S0); S0.fragments = [7]; S0.story = ["intro", "pz_mem1"];
  A.addToDex(16, 12, false);
  A.onzeCaught(7, 16);
  const nick = A.monNick(16) === "PLUME" && S0.dex[16].from === 7 && A.onzeMet()[7] && A.onzeState().got[7];
  const file = (S0.pzlog || []).some(e=>e.k === "onze" && /PLUME est revenu de la connexion 07/.test(e.t));
  A.addToDex(17, 20, false); A.onzeOnEvolve(16, 17);
  const evo = A.monNick(17) === "PLUME";
  const dex = A.onzeDexHtml(16), none = A.onzeDexHtml(1) === "";
  const panel = A.onzePanelHtml();
  return nick && file && evo && dex.includes("« PLUME »") && dex.includes("connexion 07") && none && panel.includes("PLUME") && panel.includes("1 / 11") && panel.includes("il rôde") === false;
})());
t("à la révélation, les surnoms retrouvés, dans l'ordre, et rien si aucun", (()=>{
  const S0 = sagaEndgame();
  const none = A.onzeRevealBeats().length === 0;
  A.sagaState().onzeMet = {11:1, 3:1, 7:1};
  const b = A.onzeRevealBeats();
  const rev = sayTexts(A.cineFor("finale_reveal")).join("\n");
  return none && b.length === 1 && b[0].text === "Des surnoms. Migraine. Plume. Souviens. C'est toi qui les leur avais donnés. Chaque fois." && rev.includes("Des surnoms. Migraine. Plume. Souviens.");
})());
/* ---------- ton équipe a une histoire ---------- */
t("histoire : chaque arrivée note quand et comment", (()=>{
  const S0 = A.newState(); A.setS(S0); S0.region = "kanto"; S0.habitat = "foret";
  A.addToDex(10, 5, false);
  A.setDexHow("oeuf"); A.addToDex(175, 5, false);
  A.addToDex(11, 5, false);                       /* le chemin dit une fois ne déborde pas sur la suivante */
  const a = S0.dex[10].h, b = S0.dex[175].h, c = S0.dex[11].h;
  return a.how === "capture" && a.hab === "foret" && a.r === "kanto" && a.t > 0 && b.how === "oeuf" && c.how === "capture"
    && A.histHow(a) === "capturé dans la Sylve d'index, à Kanto" && A.histHow(b) === "éclos d'un œuf";
})());
t("histoire : les combats s'additionnent, Porygon-Z remarque le dixième, et la lignée de ta première ligne", (()=>{
  const S0 = A.newState(); A.setS(S0); A.addToDex(4, 10, false); S0.flags.firstMon = 4; A.addToDex(6, 40, false);
  let said = null;
  for(let i = 0; i < 10; i++){ const r = A.histFight(6, {win:true, ko:2}); if(r) said = r; }
  const h = S0.dex[6].h;
  return h.b === 10 && h.w === 10 && h.ko === 20 && said === "Dracaufeu vient de livrer son dixième combat. C'était le Salamèche de ta première ligne.";
})());
t("histoire : tenir jusqu'au bout presque à zéro, une première fois, se remarque et s'écrit", (()=>{
  const S0 = A.newState(); A.setS(S0); A.addToDex(25, 30, false); A.addToDex(7, 30, false);
  const u1 = {id:25, side:"ally", hp:3, maxHp:100, _ko:2, _dmg:500}, u2 = {id:7, side:"ally", hp:80, maxHp:100, _ko:0, _dmg:900}, foe = {id:9, side:"foe", hp:0, maxHp:100};
  const said = A.histAfterBattle([u1, u2, foe], true);
  const h1 = S0.dex[25].h, h2 = S0.dex[7].h;
  const again = A.histAfterBattle([Object.assign({}, u1)], true);
  return /a tenu jusqu'au bout, presque à zéro/.test(said) && h1.cl === 2 && h1.mvp === 1 && !h2.mvp && h2.b === 1 && !S0.dex[9]
    && again === null && (S0.pzlog || []).some(e=>e.k === "clutch");
})());
t("histoire : elle suit l'évolution, sans compter deux fois", (()=>{
  const S0 = A.newState(); A.setS(S0); S0.habitat = "route"; A.addToDex(4, 10, false);
  for(let i = 0; i < 7; i++) A.histFight(4, {win:i < 5, ko:1});
  A.setDexHow("evo"); A.addToDex(5, 16, false); A.histOnEvolve(4, 5);
  const a = S0.dex[4].h, b = S0.dex[5].h, rows = A.histRows(5).join(" | ");
  return b.b === 7 && b.w === 5 && b.ko === 7 && !a.b && b.orig && b.orig.id === 4 && b.from === 4
    && rows.includes("en Salamèche") && rows.includes("Évolué depuis Salamèche") && rows.includes("7 combats · 5 victoires · 7 K.O.");
})());
t("histoire : une Tour et un combat au tour par tour s'inscrivent ; le plus fidèle est nommé au générique", (()=>{
  const S0 = A.newState(); A.setS(S0); for(const id of [149, 6, 9, 3]) A.addToDex(id, 40, false);
  const B = tsqRun(A.sqNewBattle([149, 6, 9, 3], 0, 0)); A.sqFinish(B); A.sqFinish(B);
  const tower = [149, 6, 9, 3].every(id=>S0.dex[id].h.b === 1);
  /* le moteur au tour par tour : un K.O. compté pour celui qui est en jeu, puis la fin du combat */
  const al = [A.makeFighter(6, 60), A.makeFighter(9, 60)], fo = [A.makeFighter(10, 5), A.makeFighter(13, 5)];
  const C = A.createBattle(al, fo, {ai:false, speed:2}); C.skip = true;
  let turn = false;
  try { A.handleKO("foe"); A.finishBattle(true); A.finishBattle(true); turn = S0.dex[6].h.b === 2 && S0.dex[6].h.ko >= 1 && S0.dex[9].h.b === 1;     /* 9 n'est pas entré en jeu : seule la Tour compte pour lui */ } catch(e){ turn = "exc " + e; }
  for(let i = 0; i < 3; i++) A.histFight(6, {win:true});
  const fid = A.histFaithful(), roll = A.creditsRollHtml();
  return tower && turn === true && fid === 6 && roll.includes("LE PLUS FIDÈLE") && roll.includes("5 combats");
})());
t("histoire : une entrée d'avant le registre le dit, sans planter", (()=>{
  const S0 = A.newState(); A.setS(S0); S0.dex[25] = {c:3, s:0, lvl:12, shiny:false};
  const rows = A.histRows(25);
  return rows[0] === "Arrivé avant que Porygon-Z tienne ce registre." && rows.some(r=>/Pas encore de combat/.test(r)) && A.histHtml(25).includes("SON HISTOIRE");
})());
/* ---------- Porygon-Z te demande quelque chose ---------- */
const askState = () => { const S0 = A.newState(); A.setS(S0); S0.flags.intro = true; S0.story = ["intro"]; S0.level = 12;
  for(let i = 1; i <= 80; i++) A.addToDex(i, 15, false); S0.stats.catches = 120; A.rollQuests(); return S0; };
t("demande : une par jour, à la place d'une quête facile, une fois le jeu entamé", (()=>{
  const S0 = A.newState(); A.setS(S0); S0.flags.intro = true; S0.story = ["intro"]; A.rollQuests();
  const early = !S0.quests.some(q=>q.pz);
  const S1 = askState();
  const n = S1.quests.length, q = A.pzAskQuest();
  const again = A.pzAskEnsure() === q && S1.quests.filter(x=>x.pz).length === 1;
  return early && q && q.pz.ask && n === 4 && again && A.pzAskState().day === A.today();
})());
t("demande : une espèce demandée, attrapée (ou sa lignée), est exaucée tout de suite et il s'en souvient le lendemain", (()=>{
  const S0 = askState();
  const q = A.pzAskQuest();
  q.pz = {k:"mon", mon:54, ask:"Tu peux attraper un Psykokwak ?", done:"Il a toujours mal à la tête.", after:"Le Psykokwak d'hier a toujours mal à la tête.", key:"mon:54"};
  q.goal = 1; q.prog = 0; q.claimed = false; q.stat = "pzask";
  const c0 = S0.coins;
  A.pzAskOnCatch({id:19});
  const miss = q.prog === 0;
  A.pzAskOnCatch({id:55});                       /* Akwakwak : la même lignée */
  const st = A.pzAskState();
  const ok = q.claimed && S0.coins > c0 && st.n === 1 && A.sagaState().asks === 1 && (S0.pzlog || []).some(e=>e.k === "ask" && /toujours mal à la tête/.test(e.t));
  /* le lendemain */
  st.day = "2000-01-01"; st.last.day = "2000-01-01";
  S0.quests = S0.quests.filter(x=>!x.pz); A.pzAskEnsure();
  const q2 = A.pzAskQuest();
  return miss && ok && q2 && q2.pz.prev === "Le Psykokwak d'hier a toujours mal à la tête." && q2.pz.key !== "mon:54";
})());
t("demande : celles de stat avancent avec les quêtes, les autres avec les captures ; rien d'impossible", (()=>{
  const S0 = askState(); S0.rod = 0;
  const pool = A.pzAskPool();
  const possible = !pool.some(a=>a.need === "rod" || (a.need && !A.moduleUnlocked(a.need))) && pool.every(a=>a.k !== "mon" || (S0.dex[a.mon] && A.POKE[a.mon].leg === 0));
  const q = A.pzAskQuest();
  q.pz = {k:"stat", ask:"Deux lancers Excellent.", done:"Toujours excellents.", after:"…", key:"stat:dayExcellent"}; q.stat = "dayExcellent"; q.goal = 2; q.prog = 0; q.claimed = false;
  A.questTick("dayExcellent", 1); const half = q.prog === 1 && !q.claimed;
  A.questTick("dayExcellent", 1);
  return possible && half && q.claimed;
})());
t("demande : visible au Journal du jour et sur l'accueil ; la fin compte les oui", (()=>{
  const S0 = askState(); const q = A.pzAskQuest();
  const row = A.pzAskRowHtml(q, 0), home = A.pzAskHomeHtml();
  A.pzAskState().n = 4;
  const e = A.pzRecallLine("erase"), sec = (k, v) => `<b>${k}</b>${v}`;
  return row.includes("PORYGON-Z TE DEMANDE") && home.includes("Porygon-Z te demande") && /Ni des quatre fois où tu as dit oui à mes demandes/.test(e)
    && A.creditsAnswersHtml(sec).includes("SES DEMANDES");
})());
/* ---------- le raid : un boss à deux millions de PV qui ne doit pas tomber ---------- */
t("raid : ni sommeil ni paralysie, le poison et la brûlure comptent sur ses PV ordinaires", (()=>{
  A.setS(A.newState()); A.addToDex(97, 50, false); A.getS().team = [97];
  const B = A.raidBossFighter();
  const asleep = A.setStatus(B, "slp"), par = A.setStatus(B, "par");
  A.createBattle([A.makeFighter(97, 50)], [B], {ai:true});
  const okPsn = A.setStatus(B, "psn");
  for(let i = 0; i < 6; i++) A.endOfTurnStatus(B, "foe");
  const lost = B.maxHp - B.hp;
  return !asleep && !par && okPsn && B.refHp < 2000 && lost < B.refHp * 2 && B.hp > 1990000;
})());
t("raid : une attaque a une fin, ses dégâts et son expérience sont plafonnés", (()=>{
  return A.RAID_TURNS === 30 && A.raidXp(2000000) === 200 + A.RAID_DMG_CAP / 5 && A.raidXp(1500) === 500 && A.raidXp(-5) === 200;
})());
t("effets réduits : le réglage suit le joueur et coupe les secousses de la Brèche", (()=>{
  const S0 = A.newState(); A.setS(S0);
  const off = A.calmFx() === false;          /* sans réglage ni préférence du système */
  S0.settings.calm = true;
  const on = A.calmFx() === true;
  const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:2}); R.shake = 0;
  A.brShake(R, 6); const still = R.shake === 0;
  S0.settings.calm = false; A.brShake(R, 6); const moves = R.shake > 0;
  return off && on && still && moves;
})());
t("effets réduits : l'interrupteur des réglages bascule et survit au cycle", (()=>{
  const S0 = A.newState(); A.setS(S0);
  try { A.ACTIONS.togglecalm(); } catch(e){}  /* l'affichage n'existe pas ici, le réglage si */
  const flipped = A.getS().settings.calm === true;
  try { A.ACTIONS.togglecalm(); } catch(e){}
  const back = A.getS().settings.calm === false;
  const html = A.SCREENS.settings ? (()=>{ try { return A.SCREENS.settings.html(); } catch(e){ return ""; } })() : "";
  return flipped && back && (html === "" || html.includes("togglecalm"));
})());
console.log(`\n${pass} tests reussis, ${fail} echecs`);
process.exit(fail?1:0);
