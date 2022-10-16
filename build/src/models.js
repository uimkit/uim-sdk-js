// cspell:disable-file
export const pageListQueryParams = ["offset", "limit"];
export const cursorListQueryParams = ["cursor", "direction", "limit"];
export var Gender;
(function (Gender) {
    Gender[Gender["Unknown"] = 0] = "Unknown";
    Gender[Gender["Male"] = 1] = "Male";
    Gender[Gender["Female"] = 2] = "Female";
})(Gender || (Gender = {}));
export var Precense;
(function (Precense) {
    Precense[Precense["Online"] = 1] = "Online";
    Precense[Precense["Offline"] = 2] = "Offline";
    Precense[Precense["Logout"] = 3] = "Logout";
    Precense[Precense["Disabled"] = 4] = "Disabled";
    Precense[Precense["DisabledByProvider"] = 5] = "DisabledByProvider";
})(Precense || (Precense = {}));
export var ConversationType;
(function (ConversationType) {
    ConversationType[ConversationType["Private"] = 1] = "Private";
    ConversationType[ConversationType["Group"] = 2] = "Group";
    ConversationType[ConversationType["Discussion"] = 3] = "Discussion";
    ConversationType[ConversationType["System"] = 4] = "System";
    ConversationType[ConversationType["CustomerService"] = 5] = "CustomerService";
})(ConversationType || (ConversationType = {}));
export var MentionedType;
(function (MentionedType) {
    MentionedType[MentionedType["All"] = 1] = "All";
    MentionedType[MentionedType["Single"] = 2] = "Single";
})(MentionedType || (MentionedType = {}));
export var MessageType;
(function (MessageType) {
    MessageType[MessageType["Text"] = 1] = "Text";
    MessageType[MessageType["Image"] = 2] = "Image";
    MessageType[MessageType["Voice"] = 3] = "Voice";
    MessageType[MessageType["Video"] = 4] = "Video";
})(MessageType || (MessageType = {}));
//# sourceMappingURL=models.js.map