import sys
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io

def hello():
    print("Hello from Pyodide!")
    print(f"Python {sys.version}")
    print("运行在浏览器 WebAssembly 中")


def math_demo():
    result = sum(range(1, 101))
    arr = np.array([1, 2, 3, 4, 5])
    print(f"1+2+...+100 = {result}")
    print(f"numpy array: {arr}")
    print(f"mean = {arr.mean():.2f}, std = {arr.std():.2f}")
    return {
        "metrics": {
            "累加和": result,
            "均值": float(arr.mean()),
            "标准差": float(arr.std()),
            "圆周率": 3.1416
        }
    }


def plot_sin():
    x = np.linspace(0, 2, 100)
    y = np.sin(x)

    fig, ax = plt.subplots(figsize=(6, 3))
    ax.plot(x, y, color='#2a5c8a', linewidth=2)
    ax.set_title("y = sin(x), x in [0, 2]")
    ax.set_xlabel("x")
    ax.set_ylabel("sin(x)")
    ax.grid(True, alpha=0.3)
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='svg')
    plt.close(fig)
    svg = buf.getvalue().decode()
    return {"svg": svg}
