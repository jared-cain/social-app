import 'react-native-url-polyfill/auto'
import '#/lib/sentry' // must be near top
import '#/view/icons'

import React, {useEffect, useState} from 'react'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import Purchases from 'react-native-purchases'
import {RootSiblingParent} from 'react-native-root-siblings'
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {QueryProvider} from '#/lib/react-query'
import {
  initialize,
  Provider as StatsigProvider,
  tryFetchGates,
} from '#/lib/statsig/statsig'
import {s} from '#/lib/styles'
import {ThemeProvider} from '#/lib/ThemeContext'
import I18nProvider from '#/locale/i18nProvider'
import {logger} from '#/logger'
import {isAndroid,isIOS} from '#/platform/detection'
import {Provider as A11yProvider} from '#/state/a11y'
import {Provider as MutedThreadsProvider} from '#/state/cache/thread-mutes'
import {Provider as DialogStateProvider} from '#/state/dialogs'
import {listenSessionDropped} from '#/state/events'
import {
  beginResolveGeolocation,
  ensureGeolocationResolved,
  Provider as GeolocationProvider,
} from '#/state/geolocation'
import {Provider as InvitesStateProvider} from '#/state/invites'
import {Provider as LightboxStateProvider} from '#/state/lightbox'
import {MessagesProvider} from '#/state/messages'
import {Provider as ModalStateProvider} from '#/state/modals'
import {init as initPersistedState} from '#/state/persisted'
import {Provider as PrefsStateProvider} from '#/state/preferences'
import {Provider as LabelDefsProvider} from '#/state/preferences/label-defs'
import {Provider as ModerationOptsProvider} from '#/state/preferences/moderation-opts'
import {Provider as PurchasesProvider} from '#/state/purchases'
import {Provider as UnreadNotifsProvider} from '#/state/queries/notifications/unread'
import {
  Provider as SessionProvider,
  SessionAccount,
  useSession,
  useSessionApi,
} from '#/state/session'
import {readLastActiveAccount} from '#/state/session/util'
import {Provider as ShellStateProvider} from '#/state/shell'
import {Provider as ComposerProvider} from '#/state/shell/composer'
import {Provider as LoggedOutViewProvider} from '#/state/shell/logged-out'
import {Provider as ProgressGuideProvider} from '#/state/shell/progress-guide'
import {Provider as SelectedFeedProvider} from '#/state/shell/selected-feed'
import {Provider as StarterPackProvider} from '#/state/shell/starter-pack'
import {Provider as HiddenRepliesProvider} from '#/state/threadgate-hidden-replies'
import {TestCtrls} from '#/view/com/testing/TestCtrls'
import {Provider as VideoVolumeProvider} from '#/view/com/util/post-embeds/VideoVolumeContext'
import * as Toast from '#/view/com/util/Toast'
import {Shell} from '#/view/shell'
import {ThemeProvider as Alf} from '#/alf'
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'
import {NuxDialogs} from '#/components/dialogs/nuxs'
import {useStarterPackEntry} from '#/components/hooks/useStarterPackEntry'
import {Provider as IntentDialogProvider} from '#/components/intents/IntentDialogs'
import {Provider as PortalProvider} from '#/components/Portal'
import {RC_APPLE_PUBLIC_KEY, RC_GOOGLE_PUBLIC_KEY} from '#/env'
import {Splash} from '#/Splash'
import {BottomSheetProvider} from '../modules/bottom-sheet'
import {BackgroundNotificationPreferencesProvider} from '../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'
import {AppProfiler} from './AppProfiler'

SplashScreen.preventAutoHideAsync()

/**
 * Begin geolocation ASAP
 */
beginResolveGeolocation()

function InnerApp() {
  const [isReady, setIsReady] = React.useState(false)
  const {currentAccount} = useSession()
  const {resumeSession} = useSessionApi()
  const theme = useColorModeTheme()
  const {_} = useLingui()

  const hasCheckedReferrer = useStarterPackEntry()

  // init
  useEffect(() => {
    async function onLaunch(account?: SessionAccount) {
      try {
        if (account) {
          await resumeSession(account)
        } else {
          await initialize()
          await tryFetchGates(undefined, 'prefer-fresh-gates')
        }
      } catch (e) {
        logger.error(`session: resume failed`, {message: e})
      } finally {
        setIsReady(true)
      }
    }
    const account = readLastActiveAccount()
    onLaunch(account)
  }, [resumeSession])

  useEffect(() => {
    return listenSessionDropped(() => {
      Toast.show(
        _(msg`Sorry! Your session expired. Please log in again.`),
        'info',
      )
    })
  }, [_])

  return (
    <Alf theme={theme}>
      <ThemeProvider theme={theme}>
        <Splash isReady={isReady && hasCheckedReferrer}>
          <RootSiblingParent>
            <VideoVolumeProvider>
              <React.Fragment
                // Resets the entire tree below when it changes:
                key={currentAccount?.did}>
                <QueryProvider currentDid={currentAccount?.did}>
                  <PurchasesProvider>
                    <ComposerProvider>
                      <StatsigProvider>
                        <MessagesProvider>
                          {/* LabelDefsProvider MUST come before ModerationOptsProvider */}
                          <LabelDefsProvider>
                            <ModerationOptsProvider>
                              <LoggedOutViewProvider>
                                <SelectedFeedProvider>
                                  <HiddenRepliesProvider>
                                    <UnreadNotifsProvider>
                                      <BackgroundNotificationPreferencesProvider>
                                        <MutedThreadsProvider>
                                          <ProgressGuideProvider>
                                            <GestureHandlerRootView
                                              style={s.h100pct}>
                                              <TestCtrls />
                                              <Shell />
                                              <NuxDialogs />
                                            </GestureHandlerRootView>
                                          </ProgressGuideProvider>
                                        </MutedThreadsProvider>
                                      </BackgroundNotificationPreferencesProvider>
                                    </UnreadNotifsProvider>
                                  </HiddenRepliesProvider>
                                </SelectedFeedProvider>
                              </LoggedOutViewProvider>
                            </ModerationOptsProvider>
                          </LabelDefsProvider>
                        </MessagesProvider>
                      </StatsigProvider>
                    </ComposerProvider>
                  </PurchasesProvider>
                </QueryProvider>
              </React.Fragment>
            </VideoVolumeProvider>
          </RootSiblingParent>
        </Splash>
      </ThemeProvider>
    </Alf>
  )
}

function App() {
  const [isReady, setReady] = useState(false)

  React.useEffect(() => {
    Promise.all([initPersistedState(), ensureGeolocationResolved()]).then(
      () => {
        setReady(true)
      },
    )

    if (isIOS) {
      Purchases.configure({apiKey: RC_APPLE_PUBLIC_KEY})
    } else if (isAndroid) {
      Purchases.configure({apiKey: RC_GOOGLE_PUBLIC_KEY})
    }
  }, [])

  if (!isReady) {
    return null
  }

  /*
   * NOTE: only nothing here can depend on other data or session state, since
   * that is set up in the InnerApp component above.
   */
  return (
    <AppProfiler>
      <GeolocationProvider>
        <A11yProvider>
          <KeyboardProvider enabled={false} statusBarTranslucent={true}>
            <SessionProvider>
              <PrefsStateProvider>
                <I18nProvider>
                  <ShellStateProvider>
                    <InvitesStateProvider>
                      <ModalStateProvider>
                        <DialogStateProvider>
                          <LightboxStateProvider>
                            <PortalProvider>
                              <BottomSheetProvider>
                                <StarterPackProvider>
                                  <SafeAreaProvider
                                    initialMetrics={initialWindowMetrics}>
                                    <IntentDialogProvider>
                                      <InnerApp />
                                    </IntentDialogProvider>
                                  </SafeAreaProvider>
                                </StarterPackProvider>
                              </BottomSheetProvider>
                            </PortalProvider>
                          </LightboxStateProvider>
                        </DialogStateProvider>
                      </ModalStateProvider>
                    </InvitesStateProvider>
                  </ShellStateProvider>
                </I18nProvider>
              </PrefsStateProvider>
            </SessionProvider>
          </KeyboardProvider>
        </A11yProvider>
      </GeolocationProvider>
    </AppProfiler>
  )
}

export default App
