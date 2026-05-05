/// <reference path="../pb_data/types.d.ts" />
onRecordAuthRequest((e) => {
  const user = e.record;
  
  // Check if user is verified
  if (!user.get("verified")) {
    throw new BadRequestError("Please verify your email before logging in. Check your inbox for the verification link.");
  }
  
  e.next();
}, "users");