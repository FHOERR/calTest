/**
 * 简洁计算器 - 核心交互逻辑
 * 实现规范：CAL-001
 */

class Calculator {
    constructor() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = null;
        this.isInError = false;
        this.lastWasEquals = false;

        this.mainDisplay = document.getElementById('mainDisplay');
        this.previousDisplay = document.getElementById('previousOperand');
        this.operationDisplay = document.getElementById('operation');

        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        // 数字键
        document.querySelectorAll('[data-number]').forEach(btn => {
            btn.addEventListener('click', () => this.appendNumber(btn.dataset.number));
        });

        // 运算符键
        document.querySelectorAll('[data-operator]').forEach(btn => {
            btn.addEventListener('click', () => this.chooseOperation(btn.dataset.operator));
        });

        // 功能键
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.action === 'clear') this.clear();
                if (btn.dataset.action === 'delete') this.delete();
                if (btn.dataset.action === 'equals') this.compute();
            });
        });

        // 键盘支持
        document.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
    }

    /**
     * 追加数字或小数点
     */
    appendNumber(number) {
        // 从错误态恢复（仅限数字输入）
        if (this.isInError && number !== '.') {
            this.clear();
        }

        // 小数点处理
        if (number === '.') {
            if (this.currentOperand.includes('.')) return;
            if (this.currentOperand === '' || this.currentOperand === '0') {
                this.currentOperand = '0.';
            } else {
                this.currentOperand += '.';
            }
        } else {
            // 数字处理
            if (this.currentOperand === '0') {
                this.currentOperand = number;
            } else {
                // 限制显示位数（最多 12 位有效字符）
                if (this.currentOperand.length < 12) {
                    this.currentOperand += number;
                }
            }
        }

        this.lastWasEquals = false;
        this.updateDisplay();
    }

    /**
     * 选择运算符
     * 规则：若前面已有运算，先执行前面的运算；然后保存当前状态
     */
    chooseOperation(operation) {
        if (this.isInError) return;

        // 若当前是空或仅有运算符，不动作（防止开头输入运算符）
        if (this.currentOperand === '' && this.previousOperand === '') {
            return;
        }

        // 若已有前一个操作数和运算符，先计算
        if (this.previousOperand !== '' && this.operation !== null && !this.lastWasEquals) {
            this.compute(true); // 不显示，仅计算
        }

        // 保存当前状态
        this.previousOperand = this.currentOperand || this.previousOperand;
        this.operation = operation;
        this.currentOperand = '';
        this.lastWasEquals = false;
        this.updateDisplay();
    }

    /**
     * 执行计算
     * silent: 仅内部计算，不标记为已得结果
     */
    compute(silent = false) {
        if (this.previousOperand === '' || this.operation === null) return;

        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand || this.previousOperand);

        let result;
        switch (this.operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
            case '×':
                result = prev * current;
                break;
            case '/':
            case '÷':
                if (current === 0) {
                    this.setError();
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }

        // 格式化结果
        if (Number.isFinite(result)) {
            // 限制小数位数（避免浮点误差）
            result = Math.round(result * 1e10) / 1e10;

            this.currentOperand = result.toString();
            this.previousOperand = '';
            this.operation = null;

            if (!silent) {
                this.lastWasEquals = true;
            }
        }

        this.updateDisplay();
    }

    /**
     * 删除最后一位
     */
    delete() {
        if (this.isInError) {
            this.clear();
            return;
        }

        if (this.currentOperand === '') return;

        this.currentOperand = this.currentOperand.slice(0, -1) || '0';
        this.updateDisplay();
    }

    /**
     * 清空所有状态
     */
    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = null;
        this.isInError = false;
        this.lastWasEquals = false;
        this.updateDisplay();
    }

    /**
     * 进入错误态
     */
    setError() {
        this.isInError = true;
        this.mainDisplay.textContent = 'Error';
        this.mainDisplay.classList.add('error');
    }

    /**
     * 更新显示
     */
    updateDisplay() {
        this.mainDisplay.classList.toggle('error', this.isInError);

        if (!this.isInError) {
            this.mainDisplay.textContent = this.formatDisplay(this.currentOperand);
        }

        // 更新前一操作数显示
        if (this.previousOperand !== '') {
            this.previousDisplay.textContent = this.formatDisplay(this.previousOperand);
            const opSymbol = this.operation === '×' ? '×' : this.operation === '÷' ? '÷' : this.operation;
            this.operationDisplay.textContent = opSymbol || '';
        } else {
            this.previousDisplay.textContent = '';
            this.operationDisplay.textContent = '';
        }
    }

    /**
     * 格式化显示（处理长数字、科学计数法）
     */
    formatDisplay(value) {
        if (!value || value === '0') return '0';

        const num = parseFloat(value);

        // 若是有效数字，检查是否需要科学计数法
        if (Number.isFinite(num)) {
            const str = num.toString();

            // 若显示长度超过 12 字符，用科学计数法
            if (str.length > 12 || (str.includes('e') && str.includes('-'))) {
                return num.toExponential(6).replace('e', 'E');
            }

            return str;
        }

        return value;
    }

    /**
     * 键盘输入处理
     */
    handleKeyboardInput(e) {
        // 数字 0-9
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            this.appendNumber(e.key);
        }

        // 小数点
        if (e.key === '.') {
            e.preventDefault();
            this.appendNumber('.');
        }

        // 运算符
        if (e.key === '+') {
            e.preventDefault();
            this.chooseOperation('+');
        }
        if (e.key === '-') {
            e.preventDefault();
            this.chooseOperation('-');
        }
        if (e.key === '*') {
            e.preventDefault();
            this.chooseOperation('*');
        }
        if (e.key === '/') {
            e.preventDefault();
            this.chooseOperation('/');
        }

        // 等号
        if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            this.compute();
        }

        // 清空 (Escape, C, c)
        if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            this.clear();
        }

        // 删除 (Backspace)
        if (e.key === 'Backspace') {
            e.preventDefault();
            this.delete();
        }
    }
}

// 初始化计算器
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
