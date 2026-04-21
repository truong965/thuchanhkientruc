import type { Food } from '../../services';

interface Props {
  food: Food;
  onAction: (food: Food) => void;
  actionLabel: string;
  actionClass?: string;
  isAdmin?: boolean;
}

export default function FoodCard({ food, onAction, actionLabel, actionClass = 'btn-primary', isAdmin }: Props) {
  return (
    <div className={`card food-card ${!food.available && !isAdmin ? 'out-of-stock' : ''}`}>
      <div className="food-image-container">
        {food.imageUrl ? (
          <img src={food.imageUrl} alt={food.name} className="food-image" />
        ) : (
          <div className="food-image-placeholder">No Image</div>
        )}
        {!food.available && <div className="food-badge-err">Hết hàng</div>}
        <div className="food-category-tag">{food.category}</div>
      </div>
      
      <div className="food-info">
        <div className="row-between">
          <h3 className="food-name">{food.name}</h3>
          <span className="food-price">{food.price.toLocaleString('vi-VN')}₫</span>
        </div>
        <p className="food-desc muted">{food.description || 'Chưa có mô tả cho món ăn này.'}</p>
        
        <div className="food-footer">
          <button 
            type="button" 
            className={`btn btn-full ${actionClass}`}
            onClick={() => onAction(food)}
            disabled={!food.available && !isAdmin}
          >
            {food.available || isAdmin ? actionLabel : 'Tạm hết'}
          </button>
        </div>
      </div>
    </div>
  );
}
