(
  function () {
    angular
    .module('multiSigWeb')
    .controller('navCtrl', function ($scope, Wallet, Connection, Transaction, Config, LightWallet, $interval, $sce, $location, $uibModal) {
      $scope.navCollapsed = true;
      $scope.isElectron = isElectron;
      $scope.config = Config.getConfiguration();

      // Reload config when it changes
      $scope.$watch(
        function () {
          return Config.updates;
        },
        function () {
          $scope.config = Config.getUserConfiguration();
        }
      );

      // If not terms acepted, prompt disclaimer
      var termsAccepted = localStorage.getItem("termsAccepted");

      if (!termsAccepted) {
        $uibModal.open({
          templateUrl: 'partials/modals/disclaimer.html',
          size: 'md',
          backdrop: 'static',
          windowClass: 'bootstrap-dialog type-danger',
          controller: function ($scope, $uibModalInstance) {
            $scope.ok = function () {
              $uibModalInstance.close($scope.walletOption);
              localStorage.setItem("termsAccepted", true);
            };
          }
        });
      }


      $scope.updateInfo = function () {

        /**
        * Setup Ethereum Chain infos
        */
        Transaction.getEthereumChain().then(
          function (data) {
            $scope.ethereumChain = data;
            txDefaultOrig.walletFactoryAddress = data.walletFactoryAddress;
            loadConfiguration(); // config.js
          }
        );

        return Wallet.initParams().then(function () {
          $scope.loggedIn = Wallet.coinbase;
          if (isElectron) {
            var accounts = Config.getConfiguration('accounts');
            if (accounts) {
              accounts = accounts.map(function(account) {
                if (!account.address.startsWith('0x')) {
                  return '0x' + account.address;
                }
                return account.address;
              });
            }
            $scope.accounts = accounts;
            if (!Wallet.coinbase.startsWith('0x')) {
              Wallet.coinbase = '0x' + Wallet.coinbase;
            }
          }
          else {
            $scope.accounts = Wallet.accounts;
          }

          $scope.coinbase =  Wallet.coinbase;
          $scope.nonce = Wallet.txParams.nonce;
          $scope.balance = Wallet.balance;
        });
      };

      /**
      * Updates connection status
      */
      $scope.statusIcon = $sce.trustAsHtml('<i class=\'fa fa-refresh fa-spin fa-fw\' aria-hidden=\'true\'></i>');

      $scope.updateConnectionStatus = function () {
        $scope.$watch(function(){
          $scope.connectionStatus = Connection.isConnected;
          $scope.statusIcon = Connection.isConnected ? $sce.trustAsHtml('Online <i class=\'fa fa-circle online-status\' aria-hidden=\'true\'></i>') : $sce.trustAsHtml('<i class=\'fa fa-refresh fa-spin fa-fw\' aria-hidden=\'true\'></i> Offline <i class=\'fa fa-circle offline-status\' aria-hidden=\'true\'></i>');
        });

      };

      Wallet.webInitialized.then(
        function () {
          if (isElectron) {
            LightWallet.setup();
          }
          $scope.interval = $interval($scope.updateInfo, 5000);
          // $scope.updateInfo();

          /**
          * Lookup connection status
          * Check connectivity first on page loading
          * and then at time interval
          */
          Connection.checkConnection();
          $scope.updateConnectionStatus();
          $scope.connectionInterval = $interval($scope.updateConnectionStatus, txDefault.connectionChecker.checkInterval);

          $scope.updateInfo().then(function () {
            if (!Wallet.coinbase && txDefault.wallet !== "ledger") {
              $uibModal.open({
                templateUrl: 'partials/modals/web3Wallets.html',
                size: 'md',
                backdrop: 'static',
                windowClass: 'bootstrap-dialog type-info',
                controller: function ($scope, $uibModalInstance) {
                  $scope.ok = function () {
                    $uibModalInstance.close();
                  };
                }
              });
            }
          });
        }
      );

      $scope.$on('$destroy', function () {
        $interval.cancel($scope.interval);
      });

      $scope.selectAccount = function (account) {
        Wallet.selectAccount(account);
        $scope.updateInfo();
      };

      $scope.getMenuItemClass = function (path) {
        if ($location.path() == path) {
          return 'active';
        }
      };
    });
  }
)();
