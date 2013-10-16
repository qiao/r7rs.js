((lambda (f n)
   (f f n))
 (lambda (f n)
   (if (< n 2)
       n
       (+ (f f (- n 1))
          (f f (- n 2)))))
 25)
