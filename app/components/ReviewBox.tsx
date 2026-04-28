export default function ReviewBox() {
    return (
      <div className="flex flex-col items-center justify-center mt-12 space-y-6 sm:space-y-0 sm:flex-row sm:space-x-6">
        {/* Avatar Group */}
        <div className="avatar-group -space-x-5">
          <div className="avatar">
            <div className="w-10">
              <img src="profiles/user1.jpg" />
            </div>
          </div>
          <div className="avatar">
            <div className="w-10">
              <img src="profiles/user2.jpg" />
            </div>
          </div>
          <div className="avatar">
            <div className="w-10">
              <img src="profiles/user3.jpg" />
            </div>
          </div>
          <div className="avatar">
            <div className="w-10">
              <img src="profiles/user4.jpg" />
            </div>
          </div>
          <div className="avatar">
            <div className="w-10">
              <img src="profiles/user5.jpg" />
            </div>
          </div>
        </div>
  
        {/* Stars and Text */}
        <div className="flex flex-col items-center sm:items-start space-y-2">
          <div className="rating scale-80">
            <input type="radio" name="rating-4" className="mask mask-star-2 bg-yellow-400" />
            <input type="radio" name="rating-4" className="mask mask-star-2 bg-yellow-400" />
            <input type="radio" name="rating-4" className="mask mask-star-2 bg-yellow-400" />
            <input type="radio" name="rating-4" className="mask mask-star-2 bg-yellow-400" />
            <input type="radio" name="rating-4" className="mask mask-star-2 bg-yellow-400" />
          </div>
          <p className="text-sm">
            <span className="font-bold">1,921</span> height estimates generated
          </p>
        </div>
      </div>
    );
  }
  
