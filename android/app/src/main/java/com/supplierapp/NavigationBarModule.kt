package com.supplierapp

import android.graphics.Color
import android.os.Build
import android.view.View
import android.view.Window
import android.view.WindowInsetsController
import androidx.core.view.WindowCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class NavigationBarModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun setColor(colorString: String) {
    val activity = getCurrentActivity() ?: return

    UiThreadUtil.runOnUiThread {
      val parsedColor =
          try {
            Color.parseColor(colorString)
          } catch (_: IllegalArgumentException) {
            Color.TRANSPARENT
          }

      applyNavigationBarColor(activity.window, parsedColor)
    }
  }

  @ReactMethod
  fun setHidden(hidden: Boolean) {
    val activity = getCurrentActivity() ?: return

    UiThreadUtil.runOnUiThread {
      applyNavigationBarHidden(activity.window, hidden)
    }
  }

  companion object {
    const val NAME = "NavigationBarModule"

    @Volatile var navigationBarHidden: Boolean = true

    @Volatile var navigationBarColor: Int = Color.TRANSPARENT

    fun applyNavigationBarColor(
        window: Window,
        color: Int,
    ) {
      navigationBarColor = color

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        window.navigationBarColor = color
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        window.isNavigationBarContrastEnforced = false
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        window.navigationBarDividerColor = Color.TRANSPARENT
      }
    }

    fun applyNavigationBarHidden(
        window: Window,
        hidden: Boolean,
    ) {
      navigationBarHidden = hidden

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        window.isNavigationBarContrastEnforced = false
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val controller = window.insetsController

        if (controller != null) {
          if (hidden) {
            controller.hide(android.view.WindowInsets.Type.navigationBars())
            controller.systemBarsBehavior =
                WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
          } else {
            controller.show(android.view.WindowInsets.Type.navigationBars())
          }
        }

        WindowCompat.setDecorFitsSystemWindows(window, false)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      } else {
        @Suppress("DEPRECATION")
        val decorView = window.decorView
        decorView.systemUiVisibility =
            if (hidden) {
              View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                  View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                  View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                  View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                  View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            } else {
              View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                  View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                  View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            }
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        window.navigationBarColor = navigationBarColor
      }
    }
  }
}
