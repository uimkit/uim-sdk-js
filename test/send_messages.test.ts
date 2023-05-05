import { buildClient } from './client';
import { readFileSync } from 'fs';
import { relative, basename } from 'path';

describe('send_messages', () => {
  jest.setTimeout(300000);
  const client = buildClient();

  // it('send text message to conversation', async () => {
  //   const sendReq = client.createTextMessage({
  //     conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
  //     text: '我在的',
  //   });
  //   const messageId = sendReq.id;
  //   console.log('message id: %s', messageId);
  //   const message = await client.sendMessage(sendReq);
  //   console.log(JSON.stringify(message, undefined, 4));
  //   expect(message.id).toBe(messageId);
  // });

  // it('send text message to contact', async () => {
  //   const sendReq = client.createTextMessage({
  //     from: 'JTtg4oIp8R-rdWAIvmA2x',
  //     to: 'NZU_jTLhwj6pm0jpeiQeK',
  //     text: '应该可以了',
  //   });
  //   const message = await client.sendMessage(sendReq);
  //   console.log(JSON.stringify(message, undefined, 4));
  // });

  // it('send image message to conversation', async () => {
  //   const file = loadFile('test/resources/test_image.jpeg');
  //   const sendReq = client.createImageMessage({
  //     conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
  //     file,
  //   });
  //   const message = await client.sendMessage(sendReq);
  //   console.log(JSON.stringify(message, undefined, 4));
  // });

  // it('send video message to conversation', async () => {
  //   const file = loadFile('test/resources/test_video.mp4');
  //   const sendReq = client.createVideoMessage({
  //     conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
  //     file,
  //     on_progress: (percent) => {
  //       console.log('upload progress: ' + percent);
  //     },
  //   });
  //   const message = await client.sendMessage(sendReq);
  //   console.log(JSON.stringify(message, undefined, 4));
  // });

  // it('send audio message to conversation', async () => {
  //   const file = loadFile('test/resources/test_audio.m4a');
  //   const sendReq = client.createAudioMessage({
  //     conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
  //     file,
  //   });
  //   const message = await client.sendMessage(sendReq);
  //   console.log(JSON.stringify(message, undefined, 4));
  // });

  it('send miniprogram message to conversation', async () => {
    const sendReq = client.createMiniProgramMessage({
      conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
      miniprogram: {
        content: "<?xml version=\"1.0\"?>\n<msg>\n\t<appmsg appid=\"\" sdkver=\"0\">\n\t\t<title>优衣云选服装女装批发进货</title>\n\t\t<des />\n\t\t<username />\n\t\t<action>view</action>\n\t\t<type>33</type>\n\t\t<showtype>0</showtype>\n\t\t<content />\n\t\t<url>https://mp.weixin.qq.com/mp/waerrpage?appid=wx2cb744e14895b005&amp;type=upgrade&amp;upgradetype=3#wechat_redirect</url>\n\t\t<lowurl />\n\t\t<forwardflag>0</forwardflag>\n\t\t<dataurl />\n\t\t<lowdataurl />\n\t\t<contentattr>0</contentattr>\n\t\t<streamvideo>\n\t\t\t<streamvideourl />\n\t\t\t<streamvideototaltime>0</streamvideototaltime>\n\t\t\t<streamvideotitle />\n\t\t\t<streamvideowording />\n\t\t\t<streamvideoweburl />\n\t\t\t<streamvideothumburl />\n\t\t\t<streamvideoaduxinfo />\n\t\t\t<streamvideopublishid />\n\t\t</streamvideo>\n\t\t<canvasPageItem>\n\t\t\t<canvasPageXml><![CDATA[]]></canvasPageXml>\n\t\t</canvasPageItem>\n\t\t<appattach>\n\t\t\t<attachid />\n\t\t\t<cdnthumburl>3056020100044a3048020100020301b77f02032f5aa90204dc99697102046453c16f042463663863326235312d373135652d346666332d383038372d3239393836633438343364310204011808030201000405004c53d900</cdnthumburl>\n\t\t\t<cdnthumbmd5>4abc48d8e648c7d33dbcff0f8410ad7d</cdnthumbmd5>\n\t\t\t<cdnthumblength>56038</cdnthumblength>\n\t\t\t<cdnthumbheight>576</cdnthumbheight>\n\t\t\t<cdnthumbwidth>720</cdnthumbwidth>\n\t\t\t<cdnthumbaeskey>be41bd9ee38ec7be42103c30ae8e2212</cdnthumbaeskey>\n\t\t\t<aeskey>be41bd9ee38ec7be42103c30ae8e2212</aeskey>\n\t\t\t<encryver>1</encryver>\n\t\t\t<fileext />\n\t\t\t<islargefilemsg>0</islargefilemsg>\n\t\t</appattach>\n\t\t<extinfo />\n\t\t<androidsource>0</androidsource>\n\t\t<sourceusername>gh_5afc81c5d295@app</sourceusername>\n\t\t<sourcedisplayname>优衣云选</sourcedisplayname>\n\t\t<commenturl />\n\t\t<thumburl />\n\t\t<mediatagname />\n\t\t<messageaction><![CDATA[]]></messageaction>\n\t\t<messageext><![CDATA[]]></messageext>\n\t\t<emoticongift>\n\t\t\t<packageflag>0</packageflag>\n\t\t\t<packageid />\n\t\t</emoticongift>\n\t\t<emoticonshared>\n\t\t\t<packageflag>0</packageflag>\n\t\t\t<packageid />\n\t\t</emoticonshared>\n\t\t<designershared>\n\t\t\t<designeruin>0</designeruin>\n\t\t\t<designername>null</designername>\n\t\t\t<designerrediretcturl>null</designerrediretcturl>\n\t\t</designershared>\n\t\t<emotionpageshared>\n\t\t\t<tid>0</tid>\n\t\t\t<title>null</title>\n\t\t\t<desc>null</desc>\n\t\t\t<iconUrl>null</iconUrl>\n\t\t\t<secondUrl>null</secondUrl>\n\t\t\t<pageType>0</pageType>\n\t\t\t<setKey>null</setKey>\n\t\t</emotionpageshared>\n\t\t<webviewshared>\n\t\t\t<shareUrlOriginal />\n\t\t\t<shareUrlOpen />\n\t\t\t<jsAppId />\n\t\t\t<publisherId>wxapp_wx2cb744e14895b005pages/home/index.html</publisherId>\n\t\t\t<publisherReqId />\n\t\t</webviewshared>\n\t\t<template_id />\n\t\t<md5>4abc48d8e648c7d33dbcff0f8410ad7d</md5>\n\t\t<websearch>\n\t\t\t<rec_category>0</rec_category>\n\t\t\t<channelId>0</channelId>\n\t\t</websearch>\n\t\t<weappinfo>\n\t\t\t<pagepath><![CDATA[pages/home/index.html]]></pagepath>\n\t\t\t<username>gh_5afc81c5d295@app</username>\n\t\t\t<appid>wx2cb744e14895b005</appid>\n\t\t\t<version>5</version>\n\t\t\t<type>2</type>\n\t\t\t<weappiconurl><![CDATA[http://wx.qlogo.cn/mmhead/Q3auHgzwzM7icT6HMYDzbufvCRT4UrW6WjNVoBX9Cbe3NRhLJf7IicmQ/96]]></weappiconurl>\n\t\t\t<shareId><![CDATA[1_wx2cb744e14895b005_2fb4b47c397ff6d21d817e1f7ba5a3e5_1683210610_0]]></shareId>\n\t\t\t<appservicetype>0</appservicetype>\n\t\t\t<secflagforsinglepagemode>0</secflagforsinglepagemode>\n\t\t\t<videopageinfo>\n\t\t\t\t<thumbwidth>720</thumbwidth>\n\t\t\t\t<thumbheight>576</thumbheight>\n\t\t\t\t<fromopensdk>0</fromopensdk>\n\t\t\t</videopageinfo>\n\t\t</weappinfo>\n\t\t<statextstr />\n\t\t<musicShareItem>\n\t\t\t<musicDuration>0</musicDuration>\n\t\t</musicShareItem>\n\t\t<finderLiveProductShare>\n\t\t\t<finderLiveID><![CDATA[]]></finderLiveID>\n\t\t\t<finderUsername><![CDATA[]]></finderUsername>\n\t\t\t<finderObjectID><![CDATA[]]></finderObjectID>\n\t\t\t<finderNonceID><![CDATA[]]></finderNonceID>\n\t\t\t<liveStatus><![CDATA[]]></liveStatus>\n\t\t\t<appId><![CDATA[]]></appId>\n\t\t\t<pagePath><![CDATA[]]></pagePath>\n\t\t\t<productId><![CDATA[]]></productId>\n\t\t\t<coverUrl><![CDATA[]]></coverUrl>\n\t\t\t<productTitle><![CDATA[]]></productTitle>\n\t\t\t<marketPrice><![CDATA[0]]></marketPrice>\n\t\t\t<sellingPrice><![CDATA[0]]></sellingPrice>\n\t\t\t<platformHeadImg><![CDATA[]]></platformHeadImg>\n\t\t\t<platformName><![CDATA[]]></platformName>\n\t\t\t<shopWindowId><![CDATA[]]></shopWindowId>\n\t\t\t<flashSalePrice><![CDATA[0]]></flashSalePrice>\n\t\t\t<flashSaleEndTime><![CDATA[0]]></flashSaleEndTime>\n\t\t\t<ecSource><![CDATA[]]></ecSource>\n\t\t\t<sellingPriceWording><![CDATA[]]></sellingPriceWording>\n\t\t\t<platformIconURL><![CDATA[]]></platformIconURL>\n\t\t\t<firstProductTagURL><![CDATA[]]></firstProductTagURL>\n\t\t\t<firstProductTagAspectRatioString><![CDATA[0.0]]></firstProductTagAspectRatioString>\n\t\t\t<secondProductTagURL><![CDATA[]]></secondProductTagURL>\n\t\t\t<secondProductTagAspectRatioString><![CDATA[0.0]]></secondProductTagAspectRatioString>\n\t\t\t<firstGuaranteeWording><![CDATA[]]></firstGuaranteeWording>\n\t\t\t<secondGuaranteeWording><![CDATA[]]></secondGuaranteeWording>\n\t\t\t<thirdGuaranteeWording><![CDATA[]]></thirdGuaranteeWording>\n\t\t\t<isPriceBeginShow>false</isPriceBeginShow>\n\t\t</finderLiveProductShare>\n\t\t<finderOrder>\n\t\t\t<appID><![CDATA[]]></appID>\n\t\t\t<orderID><![CDATA[]]></orderID>\n\t\t\t<path><![CDATA[]]></path>\n\t\t\t<priceWording><![CDATA[]]></priceWording>\n\t\t\t<stateWording><![CDATA[]]></stateWording>\n\t\t\t<productImageURL><![CDATA[]]></productImageURL>\n\t\t\t<products><![CDATA[]]></products>\n\t\t\t<productsCount><![CDATA[0]]></productsCount>\n\t\t</finderOrder>\n\t\t<finderShopWindowShare>\n\t\t\t<finderUsername><![CDATA[]]></finderUsername>\n\t\t\t<avatar><![CDATA[]]></avatar>\n\t\t\t<nickname><![CDATA[]]></nickname>\n\t\t\t<commodityInStockCount><![CDATA[]]></commodityInStockCount>\n\t\t\t<appId><![CDATA[]]></appId>\n\t\t\t<path><![CDATA[]]></path>\n\t\t\t<appUsername><![CDATA[]]></appUsername>\n\t\t\t<query><![CDATA[]]></query>\n\t\t\t<liteAppId><![CDATA[]]></liteAppId>\n\t\t\t<liteAppPath><![CDATA[]]></liteAppPath>\n\t\t\t<liteAppQuery><![CDATA[]]></liteAppQuery>\n\t\t\t<platformTagURL><![CDATA[]]></platformTagURL>\n\t\t\t<saleWording><![CDATA[]]></saleWording>\n\t\t\t<reputationInfo>\n\t\t\t\t<hasReputationInfo>0</hasReputationInfo>\n\t\t\t\t<reputationScore>0</reputationScore>\n\t\t\t\t<reputationWording />\n\t\t\t\t<reputationTextColor />\n\t\t\t\t<reputationLevelWording />\n\t\t\t\t<reputationBackgroundColor />\n\t\t\t</reputationInfo>\n\t\t\t<productImageURLList />\n\t\t</finderShopWindowShare>\n\t\t<findernamecard>\n\t\t\t<username />\n\t\t\t<avatar><![CDATA[]]></avatar>\n\t\t\t<nickname />\n\t\t\t<auth_job />\n\t\t\t<auth_icon>0</auth_icon>\n\t\t\t<auth_icon_url />\n\t\t\t<ecSource><![CDATA[]]></ecSource>\n\t\t</findernamecard>\n\t\t<finderGuarantee>\n\t\t\t<scene><![CDATA[0]]></scene>\n\t\t</finderGuarantee>\n\t\t<directshare>0</directshare>\n\t\t<gamecenter>\n\t\t\t<namecard>\n\t\t\t\t<iconUrl />\n\t\t\t\t<name />\n\t\t\t\t<desc />\n\t\t\t\t<tail />\n\t\t\t\t<jumpUrl />\n\t\t\t</namecard>\n\t\t</gamecenter>\n\t\t<patMsg>\n\t\t\t<chatUser />\n\t\t\t<records>\n\t\t\t\t<recordNum>0</recordNum>\n\t\t\t</records>\n\t\t</patMsg>\n\t\t<secretmsg>\n\t\t\t<issecretmsg>0</issecretmsg>\n\t\t</secretmsg>\n\t\t<referfromscene>0</referfromscene>\n\t\t<gameshare>\n\t\t\t<liteappext>\n\t\t\t\t<liteappbizdata />\n\t\t\t\t<liteapppriority>0</liteapppriority>\n\t\t\t</liteappext>\n\t\t\t<gameshareid />\n\t\t\t<sharedata />\n\t\t\t<isvideo>0</isvideo>\n\t\t\t<duration>-1</duration>\n\t\t\t<isexposed>0</isexposed>\n\t\t\t<readtext />\n\t\t</gameshare>\n\t</appmsg>\n\t<fromusername>fioman</fromusername>\n\t<scene>0</scene>\n\t<appinfo>\n\t\t<version>1</version>\n\t\t<appname></appname>\n\t</appinfo>\n\t<commenturl></commenturl>\n</msg>\n",
        cover: "https://cdn.uimkit.chat/z7X7sK16QnMf4HhmYVApr.jpg"
      }
    });
    const message = await client.sendMessage(sendReq);
    console.log(JSON.stringify(message, undefined, 4));
  })
});

const loadFile = (path: string): File => {
  const buf = readFileSync(relative(process.cwd(), path));
  const ab = new ArrayBuffer(buf.length);
  const ua = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    ua[i] = buf[i];
  }
  return new File([ab], basename(path));
};
