#include <iostream>
using namespace std;

int budget(int total, int expense1, int expense2, int expense3) {
    int cost = expense1 + expense2 + expense3;
    return total - cost;
}

int main() {
    cout << "Enter your total budget: ";
    int total;
    cin >> total;

    cout << "Enter the cost of bread: ";
    int expense1;
    cin >> expense1;

    cout << "Enter the cost of milk: ";
    int expense2;
    cin >> expense2;

    cout << "Enter the cost of tomatoes and vegetables: ";
    int expense3;
    cin >> expense3;

    cout << "The remaining budget is: " << budget(total, expense1, expense2, expense3) << endl;

    return 0;
}