---
title: Maintaining an Android app is a lot of work
author: Ashish Bhatia
publication: ashishb.net
year: 2025
download-date: 2025-06-09T14:21:10+02:00
url: https://ashishb.net/programming/maintaining-android-app/
read: false
mdate: 2025-07-03T18:01
novelty-score: 43.4
---

There was [recent news](https://techcrunch.com/2025/04/29/google-play-sees-47-decline-in-apps-since-start-of-last-year/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) about 47% decline in the number of apps on Google Play Store.

As a hobby Android developer, who has been developing [MusicSync](https://musicsync.ashishb.net/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog), a [Google Play Music + Podcast replacement](https://musicsync.ashishb.net/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) for the last five years, I thought I would share my experience of maintaining an Android app. And why this reduction in the number of apps is not surprising to me.

I have [several side-projects](https://ashishb.net/programming/how-to-deploy-side-projects-as-web-services-for-free/) that run on a [backend server](https://ashishb.net/tech/server-vs-mobile-development-where-code-runs-matter/) with a limited web UI, and it is much less effort to maintain them.

However, maintaining an Android app as a side-project is a more involved affair. And here are some of the problems I have faced.

## Java vs Kotlin

Kotlin is clearly the preferred language of development if you are starting a new Android project in 2025. But what if you are maintaining a hobby project written in Java? You will start seeing incompatibility when your dependencies are re-written in Kotlin.

- If you depend on a library that uses [Kotlin’s coroutines](https://github.com/prof18/RSS-Parser/issues/160?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) or relies on Kotlin's [suspend functions](https://coil-kt.github.io/coil/java_compatibility/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog), then you will have to work around it, or rewrite your app in Kotlin as well!
- Jetpack Compose, an official Google UI library for Android is [entirely unusable](https://stackoverflow.com/questions/66433437/can-i-write-jetpack-compose-components-in-java?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) from Java.
- I would imagine that if you started with Kotlin first then a big chunk of StackOverflow questions written for Java audiences require you translate them to corresponding Kotlin code as well

To their credit, Android documentation still gives code samples in both Java and Kotlin.

## Google makes breaking changes to its libraries

Google has a habit of making breaking changes to its Android libraries. Here's a list of some of the libraries that I have used in my app and the issues I have faced.

### Media 3

Android ships with [MediaPlayer](https://developer.android.com/reference/android/media/MediaPlayer?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog).  
Google recommends its open-source library [ExoPlayer](https://github.com/google/ExoPlayer?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog).  
[ExoPlayer V1](https://github.com/google/ExoPlayer/tree/release-v1?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) was last released in 2017.  
It was replaced with backward-incompatible [ExoPlayer V2](https://github.com/google/ExoPlayer/tree/release-v2?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) which was last released in July 2024.  
And now, it has now been replaced with [backward-incompatible media3](https://www.reddit.com/r/androiddev/comments/1atqkjs/is_media3_migration_worth_it/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog).  
The [Google provided migration script](https://github.com/google/ExoPlayer/blob/release-v2/media3-migration.sh?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) is far from being complete.

Further, media3 does not follow semantic versioning,[minor version upgrades](https://github.com/androidx/media/issues/2278?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) has resulted in breaking API changes.

### Google Auth library

Google's own Auth library had a bug and [sign-in was broken](https://ashishb.net/programming/end-to-end-testing-mobile-apps/) for API 26 and lower for [months](https://gist.github.com/ashishb/108a095603446fa39eb901b006642af6?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog).

Java

```
java.lang.NoSuchMethodError: No virtual method getAndSetObject(Ljava/lang/Object;JLjava/lang/Object;)Ljava/lang/Object;
in class Lsun/misc/Unsafe; or its super classes
(declaration of 'sun.misc.Unsafe' appears in /system/framework/core-libart.jar)
  E  at com.google.common.util.concurrent.AbstractFuture$UnsafeAtomicHelper.gasWaiters(AbstractFuture.java:1394)
  E  at com.google.common.util.concurrent.AbstractFuture.releaseWaiters(AbstractFuture.java:1110)
  E  at com.google.common.util.concurrent.AbstractFuture.complete(AbstractFuture.java:1000)
  E  at com.google.common.util.concurrent.AbstractFuture.set(AbstractFuture.java:783)
  E  at com.google.auth.oauth2.OAuth2Credentials$RefreshTask.access$400(OAuth2Credentials.java:600)
  E  at com.google.auth.oauth2.OAuth2Credentials$RefreshTask$1.onSuccess(OAuth2Credentials.java:617)
...
```

### Dropping support for older Android versions

Google Ads library v24 [dropped](https://developers.google.com/admob/android/migration#migrate-to-v24?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) support for Android API 21.  
According to official Google statistics, API 21 is used by [0.1% (~4 million)](https://composables.com/android-distribution-chart?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) users.  
The rationale behind this has been left unexplained.

### Upgrades for the sake of it

Material 2 was deprecated for Material 3. No clear migration guide was provided. I tried to upgrade and some components like Sliders won't look good. Why? I don't know, and I was never able to figure out the mystic. It does not help that most documentation now refers to Jetpack Compose which I cannot use!

So, for the near term, Java-based codebase are likely stuck with Material 2.

## The UI design guidelines for Android evolve unpredictably

- Bottom bar, a featured popular on iOS was [discouraged](https://androiduipatterns.com/on-the-bottom-navigation-bar-d07d9b4b5e18?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) and then became a standard feature in Material design.
- Back and up buttons used to behave [differently](https://web.archive.org/web/20160317020901/http://developer.android.com/design/patterns/navigation.html#up-vs-back?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) and now they are supposed to behave the [same](https://developer.android.com/guide/navigation/principles#:~:text=If%20a%20user%20is%20at,and%20does%20exit%20the%20app?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog). I only learnt about it last year when I [posted](https://www.reddit.com/r/androiddev/comments/1c90gft/android_navigation_up_vs_back/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) about it on Reddit.
- You might think that you can just use Material Design components and be done with it. But migrating from one version of Material Design to another is not trivial either. And before you migrate from Material 1 to Material 2, Google deprecates it for Material 3.

## Google makes breaking changes to Android platform

Every major release of Android makes breaking changes that requires developer effort

- Toasts use to work for quick notifications, now, after API 31, itif the app is foreground. How to know if you app in foreground? You have to use [ActivityLifecycleCallbacks](https://developer.android.com/reference/android/app/Application.ActivityLifecycleCallbacks?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) for that and write ton of code and even then there are confusions about [onStart vs onResume](https://steveliles.github.io/is_my_android_app_currently_foreground_or_background.html?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog).
- Displaying notifications didn't require permissions, now after API 33, it requires [POST\_NOTIFICATIONS](https://developer.android.com/training/notify-user/notifications#permissions?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog).
- Storage permissions were either all or none, now [API 33 onwards](https://developer.android.com/about/versions/13/behavior-changes-13?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog), they can be fine-grained at the level of audio, video, and images.
- Background code execution [restrictions](https://developer.android.com/about/versions/oreo/background?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) keeps changing subtly in every release.
- Media notifications were changed in a [backward-incompatible](https://developer.android.com/about/versions/13/behavior-changes-13?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) in API 33 onwards. This [long thread](https://github.com/androidx/media/issues/216?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) explains the pain of a lot of developers.

## Crucial third-party libraries have been deprecated

Several popular third-party have been deprecated or are no longer maintained.

### Picasso

[Picasso](https://github.com/square/picasso?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) was great for image loading and has been [deprecated](https://www.reddit.com/r/androiddev/comments/1gk6bd9/picasso_is_formally_deprecated/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog). It has been replaced with [coil](https://github.com/coil-kt/coil?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) but the upgrade is not trivial.

### Glide

[Glide](https://github.com/bumptech/glide?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) an alternative to Picasso was last released in Sep 2023.

### OkHttp

[OkHttp](https://github.com/square/okhttp?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) which even Android uses internally for implementing HttpURLConnection has not seen a stable release since Oct 2023, the last stable release was 4.12.0 and even the last alpha release was in April 2024.

OkHttp 4.12.0 does not support Happy Eyeballs which is a [major issue](https://github.com/square/okhttp/issues/506?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) with IPv6 networks.

### EventBus

[EventBus](https://github.com/greenrobot/EventBus?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) was the de-facto event passing library for Android. And it is unmaintained now.

### RateThisApp

[RateThisApp](https://github.com/kobakei/Android-RateThisApp/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) was good to get app ratings, and then it was abandoned.

I don't blame the maintainers here. If you use an open-source library, you have to be prepared for the fact that it may not be maintained. I am just pointing out, how some of the obvious boilerplate tasks that one requires for building an Android app are suddenly in a limbo.

## Two different versioning schemes for everything

Android has two [versioning schemes](https://developer.android.com/tools/releases/platforms?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog), Android API version is for developers and Android version for marketing.

For example, Android 11 is API 30, Android 12 is API 31 as well as 32(!), Android 13 is API 33, Android 14 is API 34. The developer documents would reference one scheme or the other or sometimes both! And you are supposed to memorize the mappings while trying to debug issues using GitHub issues or StackOverflow. It just adds unnecessary friction and confusion.

## Forced upgrades

There are multiple versions in an Android app, all tightly coupled with each other.

- `minSdkVersion` and `targetSdkVersion` of the app
- Java `sourceCompatibility` and `targetCompatibility`
- version of dependencies
- version of Android build tool chain
- version of Gradle
- version of Android Studio

You might think that all updates are optional, but they aren't

- Gradle and Android Studio must be upgraded together for [version-compatibility](https://developer.android.com/studio/releases#android_gradle_plugin_and_android_studio_compatibility?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog)
- Upgrading Java `sourceCompatibility` and `targetCompatibility` [requires](https://github.com/JakeWharton/agp-java-support/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) upgrading Gradle (and hence, Android Studio)
- Upgrading Android build tool chain requires upgrading `minSdkVersion` and `targetSdkVersion`
- Upgrade Android build tool chain requires upgrading Gradle version
- Also, if you want to stay on an old library like Exoplayer V2, sooner or later, it will become incompatible with other dependencies, and you will be forced to upgrade to media3!

You see how you are forced to upgrade almost everything or nothing?

And what if you decide to not upgrade any of these? Well, your app will get [delisted](https://developer.android.com/google/play/requirements/target-sdk?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) if the minSdkVersion is too old.

## Conclusion

Compared to server-side development, Android development requires a bit more efforts to maintain. So, if you are planning to build an Android app as a hobby, keep the ongoing maintenance cost in mind.

## Update

After this article became popular on [Hacker News](https://news.ycombinator.com/item?id=44214835&utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog), I learnt two more issues

- App published for the first time after 2021, have to hand over [signing keys](https://commonsware.com/blog/2020/09/23/uncomfortable-questions-app-signing.html?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) to Google Play Store
- Further, multiple people suggested that I should use [F-droid](https://f-droid.org/?utm_source=https://ashishb.net&utm_medium=referral&utm_campaign=blog) to publish apps. The problem is that F-droid not only have very little reach but also it cannot solve for backward-incompatible changes to the underlying platform, abandoned libraries, and backward-incompatible changes to Android libraries.
