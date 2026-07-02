package com.supplierapp

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(savedInstanceState)

    enableEdgeToEdge()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "supplier-app"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  private fun enableEdgeToEdge() {
    WindowCompat.setDecorFitsSystemWindows(window, false)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      window.statusBarColor = Color.TRANSPARENT
      window.navigationBarColor = NavigationBarModule.navigationBarColor
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.isNavigationBarContrastEnforced = false
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.insetsController?.setSystemBarsAppearance(
          WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
          WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
      )
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      @Suppress("DEPRECATION")
      window.decorView.systemUiVisibility =
          View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
              View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
              View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    }
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      NavigationBarModule.applyNavigationBarHidden(
          window,
          NavigationBarModule.navigationBarHidden,
      )
    }
  }
}
