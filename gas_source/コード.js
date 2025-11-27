// ====== 設定項目 ======
const CONFIG_SHEET_NAME = '設定';
const DATA_SHEET_NAME = '支出記録';
// =====================

/**
 * WebアプリのUI（index.html）を表示します。
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('週次予算管理アプリぶりぶり')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Webアプリの初期表示に必要なデータを取得して返します。
 * @returns {object} 予算、今週の使用額、月間使用額、日付情報を含むオブジェクト
 */
function getInitialData() {
  try {
    const ss = SpreadsheetApp.openById('13Kd7_KrmqsGeCPJSZtkUs2tqzKt6MUbIp7KsEroNfeI');
    const configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    const dataSheet = ss.getSheetByName(DATA_SHEET_NAME);

    if (!configSheet || !dataSheet) {
      throw new Error(`'${CONFIG_SHEET_NAME}'または'${DATA_SHEET_NAME}'というシートが見つかりません。`);
    }

    const { startOfWeek, endOfWeek } = getWeekRange();
    const { startOfMonth, endOfMonth, numberOfWeeks } = getMonthRange();

    // ▼▼▼【追加】月の第何週目かを計算するロジック ▼▼▼
    const oneDay = 24 * 60 * 60 * 1000;
    const daysFromMonthStart = Math.floor((startOfWeek.getTime() - startOfMonth.getTime()) / oneDay);
    const weekNumber = Math.floor(daysFromMonthStart / 7) + 1;
    // ▲▲▲ ここまで ▲▲▲

    // ▼▼▼【改善】複数のセル読み込みを1回にまとめる ▼▼▼
    const budgets = configSheet.getRange('B2:B3').getValues();
    const foodBudget = budgets[0][0];
    const dailyGoodsBudget = budgets[1][0];
    // ▲▲▲ ここまで ▲▲▲

    let weeklyFoodUsage = 0;
    let weeklyDailyGoodsUsage = 0;
    let monthlyFoodUsage = 0;
    let monthlyDailyGoodsUsage = 0;
    
    const data = dataSheet.getDataRange().getValues();
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const timestamp = new Date(data[i][0]);
        const category = data[i][1];
        const amount = Number(data[i][2]);

        if (timestamp >= startOfWeek && timestamp <= endOfWeek) {
          if (category === '食費') weeklyFoodUsage += amount;
          else if (category === '日用品') weeklyDailyGoodsUsage += amount;
        }
        
        if (timestamp >= startOfMonth && timestamp <= endOfMonth) {
          if (category === '食費') monthlyFoodUsage += amount;
          else if (category === '日用品') monthlyDailyGoodsUsage += amount;
        }
      }
    }

    const today = new Date();

    // ▼▼▼【改善】日付情報を文字列ではなくタイムスタンプで返す ▼▼▼
    return {
      foodBudget: foodBudget,
      dailyGoodsBudget: dailyGoodsBudget,
      weeklyFoodUsage: weeklyFoodUsage,
      weeklyDailyGoodsUsage: weeklyDailyGoodsUsage,
      monthlyFoodUsage: monthlyFoodUsage,
      monthlyDailyGoodsUsage: monthlyDailyGoodsUsage,
      numberOfWeeks: numberOfWeeks,
      weekNumber: weekNumber,
      todayTime: today.getTime(),
      startOfWeekTime: startOfWeek.getTime(),
      endOfWeekTime: endOfWeek.getTime(),
      startOfMonthTime: startOfMonth.getTime(),
      endOfMonthTime: endOfMonth.getTime()
    };
    // ▲▲▲ ここまで ▲▲▲
  } catch(e) {
    console.error(e);
    throw new Error('データの取得に失敗しました。' + e.message);
  }
}

/**
 * フォームから送信された支出をスプレッドシートに記録します。
 */
function addExpense(category, amount) {
  const numAmount = Number(amount);
  if (!category || !numAmount || !Number.isInteger(numAmount) || numAmount <= 0) {
    throw new Error('費目を選択し、正しい金額(正の整数)を入力してください。');
  }

  try {
    const ss = SpreadsheetApp.openById('13Kd7_KrmqsGeCPJSZtkUs2tqzKt6MUbIp7KsEroNfeI');
    const dataSheet = ss.getSheetByName(DATA_SHEET_NAME);
    if (!dataSheet) {
      throw new Error(`'${DATA_SHEET_NAME}' という名前のシートが見つかりません。`);
    }
    dataSheet.appendRow([new Date(), category, numAmount]);
    return getInitialData();
  } catch(e) {
    console.error(e);
    throw new Error('支出の記録に失敗しました。' + e.message);
  }
}

/**
 * 週の期間（土曜日〜金曜日）を計算します。
 */
function getWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  const diff = (dayOfWeek - 6 + 7) % 7;
  startOfWeek.setDate(today.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { startOfWeek, endOfWeek };
}

/**
 * 月の期間と週数を計算します。
 */
function getMonthRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let dayOfFirstDay = firstDayOfCurrentMonth.getDay();
  let diffToSaturday = (6 - dayOfFirstDay + 7) % 7;
  const firstSaturdayOfCurrentMonth = new Date(firstDayOfCurrentMonth);
  firstSaturdayOfCurrentMonth.setDate(firstDayOfCurrentMonth.getDate() + diffToSaturday);

  let startOfMonth, endOfMonth;

  if (today < firstSaturdayOfCurrentMonth) {
    endOfMonth = new Date(firstSaturdayOfCurrentMonth);
    endOfMonth.setDate(firstSaturdayOfCurrentMonth.getDate() - 1);
    
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    dayOfFirstDay = firstDayOfLastMonth.getDay();
    diffToSaturday = (6 - dayOfFirstDay + 7) % 7;
    startOfMonth = new Date(firstDayOfLastMonth);
    startOfMonth.setDate(firstDayOfLastMonth.getDate() + diffToSaturday);

  } else {
    startOfMonth = firstSaturdayOfCurrentMonth;

    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    dayOfFirstDay = firstDayOfNextMonth.getDay();
    diffToSaturday = (6 - dayOfFirstDay + 7) % 7;
    const firstSaturdayOfNextMonth = new Date(firstDayOfNextMonth);
    firstSaturdayOfNextMonth.setDate(firstDayOfNextMonth.getDate() + diffToSaturday);
    
    endOfMonth = new Date(firstSaturdayOfNextMonth);
    endOfMonth.setDate(firstSaturdayOfNextMonth.getDate() - 1);
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const numberOfDays = Math.round(Math.abs((endOfMonth - startOfMonth) / oneDay)) + 1;
  const numberOfWeeks = Math.ceil(numberOfDays / 7);

  startOfMonth.setHours(0, 0, 0, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return { startOfMonth, endOfMonth, numberOfWeeks };
}


/**
 * 今週の支出履歴を取得します。
 * @returns {Array<Object>} 今週の支出リスト。各オブジェクトは { timestamp, category, amount } を含む。
 */
function getWeeklyExpenses() {
  try {
    const ss = SpreadsheetApp.openById('13Kd7_KrmqsGeCPJSZtkUs2tqzKt6MUbIp7KsEroNfeI');
    const dataSheet = ss.getSheetByName(DATA_SHEET_NAME);
    if (!dataSheet) {
      throw new Error(`'${DATA_SHEET_NAME}' という名前のシートが見つかりません。`);
    }

    const { startOfWeek, endOfWeek } = getWeekRange();
    const data = dataSheet.getDataRange().getValues();
    const weeklyExpenses = [];

    if (data.length > 1) {
      for (let i = data.length - 1; i >= 1; i--) { // 新しい順に取得
        const timestamp = new Date(data[i][0]);
        if (timestamp >= startOfWeek && timestamp <= endOfWeek) {
          weeklyExpenses.push({
            row: i + 1, // 行番号を追加
            timestamp: timestamp.getTime(), // タイムスタンプで返す
            category: data[i][1],
            amount: data[i][2]
          });
        }
      }
    }

    // 日付の昇順（古いものが先）にソート
    weeklyExpenses.sort((a, b) => a.timestamp - b.timestamp);

    return weeklyExpenses;
  } catch (e) {
    console.error(e);
    throw new Error('履歴の取得に失敗しました。' + e.message);
  }
}

/**
 * 指定された行番号の支出記録を削除します。
 * @param {number} rowNumber 削除する行の番号。
 * @returns {object} 更新後の画面表示に必要なすべてのデータ。
 */
function deleteExpenseByRow(rowNumber) {
  try {
    const ss = SpreadsheetApp.openById('13Kd7_KrmqsGeCPJSZtkUs2tqzKt6MUbIp7KsEroNfeI');
    const dataSheet = ss.getSheetByName(DATA_SHEET_NAME);
    if (!dataSheet) {
      throw new Error(`'${DATA_SHEET_NAME}' という名前のシートが見つかりません。`);
    }

    // 指定された行を削除
    dataSheet.deleteRow(rowNumber);

    // 変更を即座にスプレッドシートに適用
    SpreadsheetApp.flush();

    // 削除後の最新データを取得して返す
    const initialData = getInitialData();
    return initialData;
  } catch(e) {
    console.error('Error in deleteExpenseByRow: ' + e.message);
    throw new Error('記録の削除に失敗しました。' + e.message);
  }
}
